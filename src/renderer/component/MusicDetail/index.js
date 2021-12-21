import React, {forwardRef, useImperativeHandle, useState} from 'react';
import './index.scss'
import {Lrc} from 'react-lrc';
import {LyricDoubleLine, LyricLine} from './LyricLine'
import * as Images from '../../public/Images'
import Modal from "react-modal";
import Store from '../../utils/Store'
import {AppUtils} from "../../utils/AppUtils";
import {parse as parseLrc} from "clrc";

export const MusicDetail = forwardRef(({musicDetailVisible, isDialogOpen, lrcLanguage, lrcLanguageCallback}, ref) => {

    const parseCover = (blueCover) => {
        const URL = Store.get("url")
        const showCover = blueCover && blueCover.indexOf("LoveLive") > 0
        let cover = Images.MENU_LIELLA
        if (showCover) {
            cover = URL + "LoveLive" + blueCover.split('/LoveLive')[1]
        }
        return cover
    }

    const [currentSong, setCurrentSong] = useState()
    const [jpLrc, setJpLrc] = useState('')
    const [zhLrc, setZhLrc] = useState('')
    const [romaLrc, setRomaLrc] = useState('')
    const [currentLrcTime, setCurrentLrcTime] = useState()
    const [cover, setCover] = useState()
    const [musicInfo, setMusicInfo] = useState()

    const [lrcPosition, setLrcPosition] = useState("center")

    useImperativeHandle(ref, () => ({
        setMusicDetail: (info) => {
            const mCover = parseCover(info.cover)
            if (mCover !== cover) {
                setCover(mCover)
            }
            setMusicInfo({
                name: info.name,
                singer: info.singer,
            })
            if (currentSong == null || currentSong._id !== info._id) {
                setCurrentLrcTime(0)
                setCurrentSong(info)
            } else {
                setCurrentLrcTime(info.currentTime)
            }
            if (!AppUtils.isEmpty(info.jpLrc)) {
                setJpLrc(info.jpLrc)
            }
            if (!AppUtils.isEmpty(info.zhLrc)) {
                setZhLrc(info.zhLrc)
            }
            if (!AppUtils.isEmpty(info.romaLrc)) {
                setRomaLrc(info.romaLrc)
            }
        }
    }))

    const renderItem = ({index, active, line}) => {
        if (lrcLanguage === 'jp') {
            return <LyricLine content={line.content} active={active} position={lrcPosition} lang={lrcLanguage}/>
        } else {
            const jpList = parseLrc(jpLrc)
            let content = ''
            if (index < jpList.lyrics.length) {
                content = jpList ? jpList.lyrics[index].content : ''
            }
            return (
                <LyricDoubleLine active={active} position={lrcPosition} headContent={content}
                                 footContent={line.content}/>
            )
        }
    }

    const renderLrc = () => {
        if (lrcLanguage === 'jp') {
            return jpLrc
        } else if (lrcLanguage === 'zh') {
            return zhLrc
        } else {
            return romaLrc
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
        }
    }

    const musicDetailStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0)'
        },
        content: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100%',
            borderWidth: 0,
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
            <div className={"blackArea"}/>
            <img className={"gauss"} src={cover}/>

            <div>
                <div className={'musicDetailContainer'}>
                    <div className={'lrcLeftContainer'}>
                        <img className={"cover"} src={cover}/>
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
                        <p className={'title'}>{musicInfo && musicInfo.name}</p>
                        <p className={'artist'}>{musicInfo && musicInfo.singer}</p>
                        <div className={'lrcContainer'}>
                            <Lrc
                                className="lrc"
                                style={{overflow: 'hidden !important'}}
                                lrc={renderLrc()}
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
