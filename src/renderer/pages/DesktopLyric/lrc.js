import React, {useEffect, useState} from 'react';
import './index.less'
import {ipcRenderer} from 'electron'
import * as Images from '../../public/Images'
import {AppUtils} from "../../utils/AppUtils";
import Store from '../../utils/Store'

let win = require('@electron/remote').getGlobal("lyricWindow");
let isLocking = false
let mouseX = 0
let mouseY = 0
let animationId

const green = 'rgba(11,214,158)'
const blue = 'rgba(0,141,239)'
const pink = 'rgba(255,79,176)'
const gray = 'rgba(77,84,85)'
const red = 'rgba(255,73,88)'

export default function () {
    const [prevLrc, setPrevLrc] = useState(null)
    const [nextLrc, setNextLrc] = useState(null)
    const [singleLrc, setSingleLrc] = useState(null)

    const [singleLine, setSingleLine] = useState(true)
    const [lrcLanguage, setLrcLanguage] = useState('jp')

    const [width, setWidth] = useState(window.innerWidth)
    const [height, setHeight] = useState(window.innerHeight)
    const [isLock, setIsLock] = useState(false)
    const [mouseOver, setMouseOver] = useState(false)

    const [closeOver, setCloseOver] = useState(false)
    const [lockOver, setLockOver] = useState(false)
    const [fontSizeUpOver, setFontSizeUpOver] = useState(false)
    const [fontSizeDownOver, setFontSizeDownOver] = useState(false)
    const [colorOver, setColorOver] = useState(false)
    const [lrcOver, setLrcOver] = useState(false)
    const [fontSize, setFontSize] = useState(28)

    const [textColor, setTextColor] = useState(green)

    const [nodeTree, setNodeTree] = useState({
        pageX: 0,
        pageY: 0,
    })
    const [nodeDisplay, setNodeDisplay] = useState(false)

    // 监听窗口改变大小
    const listener = function () {
        setWidth(window.innerWidth)
        setHeight(window.innerHeight)
    }

    useEffect(() => {
        if (window.innerHeight > 140 && singleLine) {
            setSingleLine(false)
        }
        if (window.innerHeight <= 140 && !singleLine) {
            setSingleLine(true)
        }
    }, [height, singleLine])

    useEffect(() => {
        if (isLock) {
            Store.set('lrcWindow', win.getBounds())
        }
    }, [isLock])

    useEffect(() => {
        // 初始化用户参数
        setTextColor(Store.get("lrcColor") || green)
        setFontSize(Store.get("lrcFontSize") || 28)
        const bounds = Store.get('lrcWindow')
        if (bounds !== undefined) {
            win.setBounds(bounds)
        }

        win.setIgnoreMouseEvents(false)
        if (process.platform === 'darwin') {
            win.setWindowButtonVisibility(false)
        }

        ipcRenderer.on("desktop-lrc-text", (event, args) => {
            setPrevLrc(args.prevLrc)
            setNextLrc(args.nextLrc)
            setSingleLrc(args.singleLrc)
        })

        ipcRenderer.on('desktop-lrc-language-change', (event, args) => {
            setLrcLanguage(args)
        })

        document.ondragstart = function () {
            return false;
        };

        window.onclick = (e) => {
            const position = document.getElementById('colorImg').getBoundingClientRect()
            const isPointInRect = AppUtils.isPointInArea(e, position)
            if (!isPointInRect) {
                setNodeDisplay(false)
            }
        }

        // 添加窗口大小变化监听器
        window.addEventListener("resize", listener)

        return () => window.removeEventListener("resize", listener)
    }, [])

    const onMouseUp = () => {
        document.removeEventListener('mouseup', onMouseUp)
        win.setResizable(true)
        cancelAnimationFrame(animationId)
    }

    const onMouseDown = (e) => {
        if (!isLocking) {
            mouseX = e.clientX
            mouseY = e.clientY
            win.setResizable(false)
            document.addEventListener('mouseup', onMouseUp)
            requestAnimationFrame(moveWindow);
        }
    }

    const moveWindow = () => {
        ipcRenderer.send('windowMoving', { mouseX, mouseY });
        animationId = requestAnimationFrame(moveWindow);
    }

    const onMouseOver = () => {
        setMouseOver(true)
    }

    const onMouseOut = () => {
        setMouseOver(false)
        setNodeDisplay(false)
    }

    function configFontSize(isUp) {
        let size = fontSize
        if (isUp && fontSize < 34) {
            size = fontSize + 2
        } else if (!isUp && fontSize > 16) {
            size = fontSize - 2
        }
        Store.set("lrcFontSize", size)
        setFontSize(size)
    }

    function configLock() {
        win.setResizable(isLock)
        win.setMovable(isLock)
        if (isLock) {
            win.setIgnoreMouseEvents(false)
        } else if (process.platform !== 'linux') {
            win.setIgnoreMouseEvents(true, {forward: true})
        }
        if (process.platform === 'darwin') {
            win.setWindowButtonVisibility(false)
        }
        setIsLock(!isLock)
        isLocking = !isLock
    }

    function renderClose() {
        let closeImg = (mouseOver && closeOver) ? Images.LRC_CLOSE_TOUCH : Images.LRC_CLOSE_UNTOUCH
        let closeVisible = (mouseOver && !isLock) ? 'visible' : 'hidden'
        return (
            <img
                src={closeImg}
                title={'关闭桌面歌词'}
                style={{width: 18, height: 18, visibility: closeVisible}}
                onClick={_ => ipcRenderer.send('toggle-desktop-lyric', false)}
                onMouseOver={_ => setCloseOver(true)}
                onMouseOut={_ => setCloseOver(false)}
            />
        )
    }

    function renderLock() {
        let lockVisible = mouseOver ? 'visible' : 'hidden'
        let lockImg = (isLock && !lockOver) ?
            Images.LRC_LOCK_LOCKED_BLUR : Images.LRC_LOCK_LOCKED
        if (!isLock && mouseOver) {
            lockImg = lockOver ? Images.LRC_LOCK_TOUCH : Images.LRC_LOCK_UNTOUCH
        }
        return (
            <img
                id={'locker'}
                src={lockImg}
                style={{width: 20, height: 18, visibility: lockVisible, marginLeft: 13}}
                title={isLock ? '解锁窗口' : '锁定窗口'}
                onClick={_ => configLock()}
                onMouseOver={_ => {
                    if (isLocking) {
                        win.setIgnoreMouseEvents(false)
                    }
                    setLockOver(true)
                }}
                onMouseOut={_ => {
                    if (isLocking && process.platform !== 'linux') {
                        win.setIgnoreMouseEvents(true, {forward: true})
                    }
                    setLockOver(false)
                }}
            />
        )
    }

    function renderFontSizeUp() {
        let fontSizeUpImg = (mouseOver && fontSizeUpOver) ?
            Images.LRC_FONTSIZE_UP_TOUCH : Images.LRC_FONTSIZE_UP_UNTOUCH
        let fontSizeUpVisible = (mouseOver && !isLock) ? 'visible' : 'hidden'
        return (
            <img
                src={fontSizeUpImg}
                title={'增大字号'}
                style={{width: 22, height: 22, visibility: fontSizeUpVisible, marginLeft: 13}}
                onClick={_ => configFontSize(true)}
                onMouseOver={_ => setFontSizeUpOver(true)}
                onMouseOut={_ => setFontSizeUpOver(false)}
            />
        )
    }

    function renderFontSizeDown() {
        let fontSizeDownImg = (mouseOver && fontSizeDownOver) ?
            Images.LRC_FONTSIZE_DOWN_TOUCH : Images.LRC_FONTSIZE_DOWN_UNTOUCH
        let fontSizeDownVisible = (mouseOver && !isLock) ? 'visible' : 'hidden'
        return (
            <img
                src={fontSizeDownImg}
                title={'减小字号'}
                style={{width: 22, height: 22, visibility: fontSizeDownVisible, marginLeft: 13}}
                onClick={_ => configFontSize(false)}
                onMouseOver={_ => setFontSizeDownOver(true)}
                onMouseOut={_ => setFontSizeDownOver(false)}
            />
        )
    }

    function renderColor() {
        let colorImg = (mouseOver && colorOver) ? Images.LRC_COLOR_TOUCH : Images.LRC_COLOR_UNTOUCH
        let colorVisible = (mouseOver && !isLock) ? 'visible' : 'hidden'
        return (
            <img
                id={'colorImg'}
                src={colorImg}
                title={'设置颜色'}
                style={{width: 18, height: 18, visibility: colorVisible, marginLeft: 13}}
                onClick={configColor}
                onMouseOver={_ => setColorOver(true)}
                onMouseOut={_ => setColorOver(false)}
            />
        )
    }

    function configColor(e) {
        setNodeTree({
            pageX: e.pageX,
            pageY: e.pageY
        })
        setNodeDisplay(true)
    }

    function renderColorPanel() {
        const {pageX, pageY} = nodeTree
        const style = {
            position: 'absolute',
            left: `${pageX}px`,
            top: `${pageY}px`,
            display: nodeDisplay ? 'flex' : 'none',
            flexDirection: 'row',
            backgroundColor: '#fff',
            borderRadius: '8px'
        }
        const menu = (
            <div style={style}>
                <div style={{width: 30, height: 30, backgroundColor: green}} onClick={_ => {
                    setTextColor(green)
                    Store.set("lrcColor", green)
                    setNodeDisplay(false)
                }}/>
                <div style={{width: 30, height: 30, backgroundColor: blue}} onClick={_ => {
                    Store.set("lrcColor", blue)
                    setTextColor(blue)
                }}/>
                <div style={{width: 30, height: 30, backgroundColor: pink}} onClick={_ => {
                    Store.set("lrcColor", pink)
                    setTextColor(pink)
                }}/>
                <div style={{width: 30, height: 30, backgroundColor: gray}} onClick={_ => {
                    Store.set("lrcColor", gray)
                    setTextColor(gray)
                }}/>
                <div style={{width: 30, height: 30, backgroundColor: red}} onClick={_ => {
                    Store.set("lrcColor", red)
                    setTextColor(red)
                }}/>
            </div>
        )
        return nodeTree ? menu : null;
    }

    function renderLrc() {
        let lrcVisible = (mouseOver && !isLock) ? 'visible' : 'hidden'
        let lrcImg
        switch (lrcLanguage) {
            case 'jp':
                lrcImg = (mouseOver && lrcOver) ?
                    Images.LRC_LANGUAGE_JAPANESE_TOUCH : Images.LRC_LANGUAGE_JAPANESE_UNTOUCH
                break
            case 'zh':
                lrcImg = (mouseOver && lrcOver) ?
                    Images.LRC_LANGUAGE_CHINESE_TOUCH : Images.LRC_LANGUAGE_CHINESE_UNTOUCH
                break
            default:
                lrcImg = (mouseOver && lrcOver) ?
                    Images.LRC_LANGUAGE_ROMA_TOUCH : Images.LRC_LANGUAGE_ROMA_UNTOUCH
                break
        }

        return (
            <img
                src={lrcImg}
                title={'切换歌词'}
                style={{width: 18, height: 18, visibility: lrcVisible, marginLeft: 13}}
                onClick={changeLrcLanguage}
                onMouseOver={_ => setLrcOver(true)}
                onMouseOut={_ => setLrcOver(false)}
            />
        )
    }

    const changeLrcLanguage = () => {
        let language
        switch (lrcLanguage) {
            case 'jp':
                language = 'zh'
                break
            case 'zh':
                language = 'roma'
                break
            default:
                language = 'jp'
                break
        }
        ipcRenderer.send('main-lrc-language-change', language)
        setLrcLanguage(language)
    }

    return (
        <div className="desktop-lyric" id="desktop"
             style={{height: height, background: mouseOver && !isLock ? '#fff' : 'transparent'}}
             onMouseDown={onMouseDown}
             onMouseEnter={onMouseOver}
             onMouseLeave={onMouseOut}
        >
            <div style={{margin: 0, height: 25, width: '100%'}}/>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div className="function" style={{visibility: mouseOver ? 'visible' : 'hidden'}}>
                    {renderClose()}
                    {renderFontSizeDown()}
                    {renderLock()}
                    {renderFontSizeUp()}
                    {renderColor()}
                    {renderLrc()}
                </div>
                <div
                    className="playing-lyric"
                    id={'lrc'}
                    style={{
                        width: singleLine ? width - 100 : width,
                        fontSize: fontSize,
                        display: 'flex',
                        color: textColor,
                        justifyContent: (singleLine || lrcLanguage !== 'jp') ? 'center' : 'flex-start',
                        marginLeft: (singleLine || lrcLanguage !== 'jp') ? 0 : 50
                    }}
                >
                    <div className={'text-lrc'} style={{maxWidth: singleLine ? width : width / 3 * 2}}>
                        {singleLine ? (singleLrc ? singleLrc.trim() : "") : (prevLrc ? prevLrc.trim() : "")}
                    </div>
                </div>
                {
                    singleLine ? null :
                        <div
                            className="playing-lyric"
                            id={'lrc'}
                            style={{
                                width: width,
                                fontSize: fontSize,
                                display: 'flex',
                                color: textColor,
                                justifyContent: lrcLanguage !== 'jp' ? 'center' : 'flex-end',
                                marginRight: lrcLanguage !== 'jp' ? 0 : 50
                            }}
                        >
                            <div className={'text-lrc'} style={{maxWidth: width / 3 * 2}}>
                                {nextLrc ? nextLrc.trim() : ""}
                            </div>
                        </div>
                }
                {renderColorPanel()}
            </div>
        </div>
    )
}
