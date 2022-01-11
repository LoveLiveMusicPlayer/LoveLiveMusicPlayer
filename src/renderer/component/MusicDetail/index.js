import React, {forwardRef, useImperativeHandle, useMemo, useState} from 'react';
import './index.scss'
import {Lrc} from 'react-lrc';
import {LyricDoubleLine, LyricLine} from './LyricLine'
import * as Images from '../../public/Images'
import Modal from "react-modal";
import Store from '../../utils/Store'
import {parse as parseLrc} from "clrc";
import {AppUtils} from "../../utils/AppUtils";

let currentPlayId = 0

export const MusicDetail = forwardRef(({musicDetailVisible, isDialogOpen, lrcLanguage, isFullScreen, lrcLanguageCallback}, ref) => {

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

    const [playProgress, setPlayProgress] = useState({name: null, time: 0, current: 0, total: 0})

    useImperativeHandle(ref, () => ({
        setMusicDetail: (info, currentIndex, totalIndex) => {

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

            setPlayProgress({name: info.name, time: info.currentTime, current: currentIndex, total: totalIndex})
        }
    }))

    useMemo(() => {
        if (3 * playProgress.current > playProgress.total) {
            playProgress.name && Store.set("upReportSong", {
                name: playProgress.name,
                time: Math.floor(playProgress.time)
            })
        }
    }, [playProgress.current, playProgress.total])

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

    const renderItem = ({active, line}) => {
        if (lrcLanguage === 'jp') {
            return <LyricLine content={line.content} active={active} position={lrcPosition} lang={lrcLanguage}/>
        } else {
            let content = ''
            timerLrc && timerLrc.map(item => {
                if (item.time === line.startMillisecond) {
                    content = lrcLanguage === 'zh' ? item.zh : item.roma
                }
            })

            return <LyricDoubleLine active={active} position={lrcPosition} headContent={line.content}
                                    footContent={content}/>
        }
    }

    const changeLrcPosition = () => {
        setLrcPosition(lrcPosition === 'center' ? 'left' : 'center')
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
            <img className={"gauss"} src={mCover} style={{top: isFullScreen ? '0%' : '5%', height: isFullScreen ? '100%' : '90%'}}/>

            <div>
                <div className={'musicDetailContainer'}>
                    <div className={'lrcLeftContainer'}>
                        <img className={"cover"} src={mCover}/>
                        <div className={'tools'}>
                            <img
                                style={{width: '30px', height: '30px'}}
                                src={lrcIcon()}
                                onClick={changeLanguage}
                            />
                            <img
                                style={{width: '30px', height: '30px'}}
                                src={lrcPosition === 'center' ? Images.ICON_POSITION_CENTER : Images.ICON_POSITION_LEFT}
                                onClick={changeLrcPosition}
                            />
                        </div>
                    </div>
                    <div className={'lrcRightContainer'}>
                        <p className={'title'}>{mName}</p>
                        <p className={'artist'}>{mSinger}</p>
                        <div className={'lrcContainer'}>
                            <Lrc
                                key={resetLrc}
                                className="lrc"
                                style={{overflow: 'hidden !important'}}
                                lrc={lrc.jpLrc}
                                intervalOfRecoveringAutoScrollAfterUserScroll={1000}
                                topBlank={true}
                                bottomBlank={true}
                                lineRenderer={renderItem}
                                currentMillisecond={currentLrcTime}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
})
