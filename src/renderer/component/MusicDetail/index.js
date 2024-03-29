import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useState} from 'react';
import './index.scss'
import {Lrc} from 'react-lrc';
import {LyricDoubleLine, LyricLine} from './LyricLine'
import * as Images from '../../public/Images'
import Modal from "react-modal";
import Store from '../../utils/Store'
import {parse as parseLrc} from "clrc";
import {AppUtils} from "../../utils/AppUtils";
import { ColorfulLight } from '../ColorfulLight';
import Bus from '../../utils/Event';

let currentPlayId = 0
let latest = {prevTime: 0, currentTime: 0, nextTime: 0}
let callback

let map = new Map()

export const MusicDetail = forwardRef(({
                                           musicDetailVisible,
                                           isDialogOpen,
                                           lrcLanguage,
                                           isFullScreen,
                                           lrcLanguageCallback
                                       }, ref) => {

    const parseCover = (blueCover) => {
        const URL = Store.get("url")
        const showCover = blueCover && blueCover.indexOf("LoveLive") > 0
        let cover = Images.MENU_LIELLA
        if (showCover) {
            cover = URL + "LoveLive" + blueCover.split('/LoveLive')[1]
        }
        return cover
    }

    const [lrc, setLrc] = useState({})
    const [timerLrc, setTimerLrc] = useState([])
    const [currentLrcTime, setCurrentLrcTime] = useState()
    const [cover, setCover] = useState()
    const [musicInfo, setMusicInfo] = useState()
    const [resetLrc, setResetLrc] = useState(new Date().getTime())

    const [lrcPosition, setLrcPosition] = useState("center")

    const [playProgress, setPlayProgress] = useState({name: null, prevTime: 0, currentTime: 0, nextTime: 0})

    useImperativeHandle(ref, () => ({
        setMusicDetail: (info, prevTime, currentTime, nextTime, timeList, researchCallback) => {

            if (callback == null) {
                callback = researchCallback;
            }

            if (timeList.length > 0) {
                latest = {prevTime: 0, currentTime: currentTime, nextTime: timeList[0]}
                map.clear()
                timeList.map(time => {
                    map.set(time, 0)
                })
            }

            setCover(parseCover(info.cover))

            setMusicInfo({
                name: info.name,
                singer: info.singer,
            })

            if (currentPlayId !== info._id) {
                currentPlayId = info._id
                setCurrentLrcTime(0)
            } else setCurrentLrcTime(info.currentTime)

            setLrc({
                jpLrc: info.jpLrc || '',
                zhLrc: info.zhLrc || '',
                romaLrc: info.romaLrc || ''
            })

            setPlayProgress({name: info.name, currentTime, prevTime, nextTime})
        }
    }))

    useMemo(() => {
        const prevTime = playProgress.prevTime
        const currentTime = playProgress.currentTime
        const nextTime = playProgress.nextTime

        if (latest.currentTime >= prevTime && latest.currentTime <= currentTime) {
            if (map.has(currentTime)) {
                map.set(currentTime, map.get(currentTime) + 1)
            }
            if (currentTime - prevTime > 800) {
                Store.set("upReportSong", JSON.stringify(AppUtils._strMapToObj(map)))
            }
        } else if (prevTime === latest.nextTime) {
            if (map.has(currentTime)) {
                map.set(currentTime, map.get(currentTime) + 1)
            }
        }


        latest = {prevTime, currentTime, nextTime}
    }, [playProgress.prevTime, playProgress.currentTime, playProgress.nextTime])

    useMemo(() => {
        const array = []
        const jpList = AppUtils.isNull(lrc.jpLrc) ? null : parseLrc(lrc.jpLrc)
        if (jpList) {
            const zhList = AppUtils.isNull(lrc.zhLrc) ? null : parseLrc(lrc.zhLrc)
            const romaList = AppUtils.isNull(lrc.romaLrc) ? null : parseLrc(lrc.romaLrc)

            jpList.lyrics.map(jp => {
                let mZh
                let mRoma
                zhList && zhList.lyrics.map(zh => {
                    if (jp.startMillisecond === zh.startMillisecond) {
                        mZh = zh.content
                    }
                })
                romaList && romaList.lyrics.map(roma => {
                    if (jp.startMillisecond === roma.startMillisecond) {
                        mRoma = roma.content
                    }
                })
                array.push({
                    time: jp.startMillisecond,
                    jp: jp.content || '',
                    zh: mZh || '',
                    roma: mRoma || ''
                })
            })
            setTimerLrc(array)
        }
    }, [lrc])

    const mCover = useMemo(() => {
        return cover
    }, [cover])

    const [mName, mSinger] = useMemo(() => {
        if (musicInfo) {
            return [musicInfo.name, musicInfo.singer]
        }
        return ['', '']
    }, [musicInfo])

    const [scaleFontSize, setScaleFontSize] = useState(16)
    const [scaleImageSize, setScaleImageSize] = useState(300)
    const [scaleIconSize, setScaleIconSize] = useState(30)

    const listener = function () {
        const widthRatio = window.innerWidth / 1250
        const heightRatio = window.innerHeight / 728
        if (widthRatio > 1.3) {
            setScaleFontSize(widthRatio * 12)
        } else if (widthRatio < 1) {
            setScaleFontSize(16)
        } else {
            setScaleFontSize(widthRatio * 16)
        }
        setScaleImageSize(heightRatio * 300)
        setScaleIconSize(heightRatio * 30)
    }

    useEffect(() => {
        window.addEventListener("resize", listener)

        return () => window.removeEventListener("resize", listener)
    }, [])

    const renderItem = ({active, line}) => {
        if (lrcLanguage === 'jp') {
            return <LyricLine
                content={line.content}
                active={active}
                position={lrcPosition}
                lang={lrcLanguage}
                scale={scaleFontSize}
            />
        } else {
            let content = ''
            timerLrc && timerLrc.map(item => {
                if (item.time === line.startMillisecond) {
                    content = lrcLanguage === 'zh' ? item.zh : item.roma
                }
            })

            return <LyricDoubleLine
                active={active}
                position={lrcPosition}
                headContent={line.content}
                footContent={content}
                scale={scaleFontSize}
            />
        }
    }

    const changeLrcPosition = () => {
        setLrcPosition(lrcPosition === 'center' ? 'left' : 'center')
    }

    const researchLyric = () => {
        callback && callback(currentPlayId)
    }

    const changeLanguage = () => {
        if (lrcLanguageCallback) {
            if (lrcLanguage === 'jp') {
                lrcLanguageCallback('zh')
            } else if (lrcLanguage === 'zh') {
                lrcLanguageCallback('roma')
            } else {
                lrcLanguageCallback('jp')
            }
            setResetLrc(new Date().getTime())
        }
    }

    const musicDetailStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: isFullScreen ? 0 : 12,
            backgroundColor: 'rgba(0, 0, 0, 0)'
        },
        content: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100%',
            borderWidth: 0,
            borderRadius: isFullScreen ? 0 : 12,
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
        },
    };

    const lrcIcon = () => {
        if (lrcLanguage === 'jp') {
            return Images.ICON_JAPANESE
        } else if (lrcLanguage === 'zh') {
            return Images.ICON_CHINESE
        } else return Images.ICON_ROMA
    }

    return (
        <Modal
            className={musicDetailVisible ? "music_detail_modal_in" : "music_detail_modal_out"}
            appElement={document.body}
            isOpen={isDialogOpen}
            onAfterOpen={null}
            onRequestClose={null}
            style={musicDetailStyles}>
            <div className={"blackArea"} style={{borderRadius: isFullScreen ? 0 : 12}}/>
            <img className={"gauss"} src={mCover}
                 style={{top: isFullScreen ? '0%' : '5%', height: isFullScreen ? '100%' : '90%'}}/>

            <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'absolute'}}>
                <div className={'musicDetailContainer'}>
                    <div className={'lrcLeftContainer'}>
                        <img className={"cover"} src={mCover} style={{width: scaleImageSize, height: scaleImageSize}}/>
                        <div className={'tools'} style={{marginTop: scaleFontSize * 2}}>
                            <img
                                style={{width: scaleIconSize, height: scaleIconSize, cursor: 'pointer'}}
                                src={lrcIcon()}
                                onClick={changeLanguage}
                            />
                            <img
                                style={{width: scaleIconSize, height: scaleIconSize, cursor: 'pointer'}}
                                src={lrcPosition === 'center' ? Images.ICON_POSITION_CENTER : Images.ICON_POSITION_LEFT}
                                onClick={changeLrcPosition}
                            />
                            <img
                                style={{width: scaleIconSize, height: scaleIconSize - 2, paddingTop: '2px', cursor: 'pointer'}}
                                src={Images.ICON_SEARCH}
                                onClick={researchLyric}
                            />
                        </div>
                    </div>
                    <div className={'lrcRightContainer'}>
                        <p className={'title'} style={{fontSize: scaleFontSize * 1.25}}>{mName}</p>
                        <p className={'artist'}>{mSinger}</p>
                        <div className={'lrcContainer'}>
                            {
                                lrc.jpLrc == null || lrc.jpLrc === '' || lrc.jpLrc === undefined ?
                                    <LyricLine
                                        content={'暂无歌词'}
                                        active={true}
                                        position={'center'}
                                        lang={'jp'}
                                        scale={scaleFontSize * 1.25}
                                    /> :
                                    <Lrc
                                        key={resetLrc}
                                        className="lrc"
                                        lrc={lrc.jpLrc}
                                        verticalSpace
                                        lineRenderer={renderItem}
                                        currentMillisecond={currentLrcTime}
                                    />
                            }
                        </div>
                    </div>
                </div>
                <div className={'topContainer'}>
                    <ColorfulLight/>
                    <img className={'top_arrow'} src={Images.ICON_DOWN_ARROW} onClick={() => Bus.emit("closeMusicDetail")}/>
                </div>
            </div>
        </Modal>
    )
})
