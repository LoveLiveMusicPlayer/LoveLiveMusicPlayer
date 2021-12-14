import React, {useEffect, useState} from 'react';
import './index.less'
import {ipcRenderer} from 'electron'
import * as Images from '../../public/Images'

let win = require('@electron/remote').getGlobal("lyricWindow");
let isLocking = false

// TODO: 歌词颜色
export default function () {
    const [currentLyric, setCurrentLyric] = useState(null)
    const [nextLyric, setNextLyric] = useState(null)
    const [singleLine, setSingleLine] = useState(true)
    const [width, setWidth] = useState(window.innerWidth)
    const [height, setHeight] = useState(window.innerHeight)
    const [isLock, setIsLock] = useState(false)
    const [mouseOver, setMouseOver] = useState(false)

    const [closeOver, setCloseOver] = useState(false)
    const [fontSizeUpOver, setFontSizeUpOver] = useState(false)
    const [fontSizeDownOver, setFontSizeDownOver] = useState(false)
    const [lockOver, setLockOver] = useState(false)
    const [fontSize, setFontSize] = useState(28)

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
        win.setIgnoreMouseEvents(false)

        document.ondragstart = function () {
            return false;
        };

        // 添加窗口大小变化监听器
        window.addEventListener("resize", listener)

        const lrc = document.querySelector(".desktop-lyric");
        let biasX = 0;
        let biasY = 0;

        let {width, height} = win.getBounds();

        const moveEvent = (e) => {
            if (win.movable) {
                win.setBounds({
                    x: e.screenX - biasX,
                    y: e.screenY - biasY,
                    width,
                    height,
                });
            }
        };

        lrc.addEventListener("mousedown", function (e) {
            if (win.movable) {
                width = win.getBounds().width;
                height = win.getBounds().height;
                switch (e.button) {
                    case 0:
                        biasX = e.x;
                        biasY = e.y;
                        lrc.addEventListener("mousemove", moveEvent);
                        break;
                    case 2:
                        break;
                }
            }
        });

        lrc.addEventListener("mouseup", (e) => {
            if (win.movable) {
                biasX = 0;
                biasY = 0;
                lrc.removeEventListener("mousemove", moveEvent);
            }
        });

        lrc.addEventListener("mouseleave", (e) => {
            setMouseOver(false)
            if (win.movable) {
                biasX = 0;
                biasY = 0;
                lrc.removeEventListener("mousemove", moveEvent);
            }
        });

        lrc.addEventListener("mouseover", (e) => {
            setMouseOver(true)
        })

        return () => window.removeEventListener("resize", listener)
    }, [])

    function configFontSize(isUp) {
        if (isUp && fontSize < 34) {
            setFontSize(fontSize + 2)
        } else if (!isUp && fontSize > 16) {
            setFontSize(fontSize - 2)
        }
    }

    function configLock() {
        win.setResizable(isLock)
        win.setMovable(isLock)
        if (isLock) {
            win.setIgnoreMouseEvents(false)
        } else {
            win.setIgnoreMouseEvents(true, {forward: true})
        }
        setIsLock(!isLock)
        isLocking = !isLock
    }

    function renderClose() {
        let closeImg = Images.LRC_CLOSE_UNTOUCH
        let closeVisible = 'visible'
        if (!mouseOver || isLock) {
            closeVisible = 'hidden'
        }
        if (mouseOver && closeOver) {
            closeImg = Images.LRC_CLOSE_TOUCH
        }
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
        let lockImg = Images.LRC_LOCK_LOCKED
        let lockVisible = 'visible'
        if (!mouseOver) {
            lockVisible = 'hidden'
        }
        if (!isLock && mouseOver) {
            if (lockOver) {
                lockImg = Images.LRC_LOCK_TOUCH
            } else {
                lockImg = Images.LRC_LOCK_UNTOUCH
            }
        }
        return (
            <img
                id={'locker'}
                src={lockImg}
                style={{width: 20, height: 18, visibility: lockVisible, marginLeft: 13}}
                title={isLock ? '锁定窗口' : '解锁窗口'}
                onClick={_ => configLock()}
                onMouseOver={_ => {
                    if (isLocking) {
                        win.setIgnoreMouseEvents(false)
                    }
                    setLockOver(true)
                }}
                onMouseOut={_ => {
                    if (isLocking) {
                        win.setIgnoreMouseEvents(true, {forward: true})
                    }
                    setLockOver(false)
                }}
            />
        )
    }

    function renderFontSizeUp() {
        let fontSizeUpImg = Images.LRC_FONTSIZE_UP_UNTOUCH
        let fontSizeUpVisible = 'visible'
        if (!mouseOver || isLock) {
            fontSizeUpVisible = 'hidden'
        }
        if (mouseOver && fontSizeUpOver) {
            fontSizeUpImg = Images.LRC_FONTSIZE_UP_TOUCH
        }
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
        let fontSizeDownImg = Images.LRC_FONTSIZE_DOWN_UNTOUCH
        let fontSizeDownVisible = 'visible'
        if (!mouseOver || isLock) {
            fontSizeDownVisible = 'hidden'
        }
        if (mouseOver && fontSizeDownOver) {
            fontSizeDownImg = Images.LRC_FONTSIZE_DOWN_TOUCH
        }
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

    return (
        <div className="desktop-lyric" id="desktop"
             style={{height: height, background: mouseOver && !isLock ? '#fff' : 'transparent'}}>
            <div className="function" style={{visibility: mouseOver ? 'visible' : 'hidden'}}>
                {renderClose()}
                {renderLock()}
                {renderFontSizeUp()}
                {renderFontSizeDown()}
            </div>
            <div
                className="playing-lyric"
                id={'lrc'}
                style={{
                    width: width,
                    fontSize: fontSize,
                    display: 'flex',
                    justifyContent: singleLine ? 'center' : 'flex-start',
                    marginLeft: singleLine ? 0 : 50
                }}
            >
                <div className={'text-lrc'} style={{maxWidth: singleLine ? width : width / 3 * 2}}>
                    {currentLyric ? currentLyric : "暂无歌词暂无歌词暂无歌词暂无歌词暂无歌词暂无歌词"}
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
                            justifyContent: 'flex-end',
                            marginRight: singleLine ? 0 : 50
                        }}
                    >
                        <div className={'text-lrc'} style={{maxWidth: width / 3 * 2}}>
                            {nextLyric ? nextLyric : "暂无歌词暂无歌词暂无歌词暂无歌词歌词暂无歌词暂无歌词"}
                        </div>
                    </div>
            }

        </div>
    )
}
