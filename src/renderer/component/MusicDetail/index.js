import React, {forwardRef, useImperativeHandle, useState} from 'react';
import './index.scss'
import {Lrc} from 'react-lrc';
import LyricLine from './LyricLine'
import FileDrop from '../../component/DragAndDrop'
import {AppUtils} from "../../utils/AppUtils";
import * as Images from '../../public/Images'
import Modal from "react-modal";
import Store from '../../utils/Store'

export const MusicDetail = forwardRef(({musicDetailVisible, isDialogOpen}, ref) => {

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
    const [currentLrcTime, setCurrentLrcTime] = useState()
    const [cover, setCover] = useState()
    const [musicInfo, setMusicInfo] = useState()
    const [lrcLanguage, setLrcLanguage] = useState("jp")
    const [lrcPosition, setLrcPosition] = useState("center")

    useImperativeHandle(ref, () => ({
        setMusicDetail: (info) => {
            const mCover = parseCover(info.cover)
            if (mCover !== cover) {
                setCover(mCover)
            }
            setMusicInfo(info)
            if (currentSong == null || currentSong._id !== info._id) {
                setCurrentLrcTime(0)
                setCurrentSong(info)
            } else if (jpLrc) {
                setCurrentLrcTime(info.currentTime * 1000)
            }
        }
    }))

    const renderItem = ({active, line}) => {
        return <LyricLine content={line.content} active={active} position={lrcPosition} lang={lrcLanguage}/>
    }

    const onUpload = (file) => {
        const name = file[0].name
        const path = file[0].path
        if (name.endsWith(".lrc")) {
            const lrc = AppUtils.readFile(path).split('\n').map(item => {
                return item.trim()
            }).join('\n')
            if (lrcLanguage === 'jp') {
                setJpLrc(lrc)
            } else {
                setZhLrc(lrc)
            }
        }
    }

    const changeLrcPosition = () => {
        setLrcPosition(lrcPosition === 'center' ? 'left' : 'center')
    }

    const changeLanguage = () => {
        setLrcLanguage(lrcLanguage === 'jp' ? 'zh' : 'jp')
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

            <FileDrop
                onUpload={onUpload}
                count={1}
                formats={['']}
            >
                <div className={'musicDetailContainer'}>
                    <div className={'lrcLeftContainer'}>
                        <img className={"cover"} src={cover}/>
                        <div className={'tools'}>
                            <img
                                style={{width: '30px', height: '30px'}}
                                src={lrcLanguage === 'jp' ? Images.ICON_JAPANESE : Images.ICON_CHINESE}
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
                                lrc={lrcLanguage === 'jp' ? jpLrc : zhLrc}
                                intervalOfRecoveringAutoScrollAfterUserScroll={1000}
                                topBlank={true}
                                bottomBlank={true}
                                lineRenderer={renderItem}
                                currentMillisecond={currentLrcTime}
                            />
                        </div>
                    </div>
                </div>
            </FileDrop>
        </Modal>
    )
})
