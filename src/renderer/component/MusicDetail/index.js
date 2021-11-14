import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import './index.scss'
import {Lrc} from 'react-lrc';
import LyricLine from './LyricLine'
import FileDrop from '../../component/DragAndDrop'
import {AppUtils} from "../../utils/AppUtils";
import Store from "../../utils/Store"

export const MusicDetail = forwardRef((props, ref) => {
    const [currentSong, setCurrentSong] = useState()
    const [jpLrc, setJpLrc] = useState('')
    const [zhLrc, setZhLrc] = useState('')
    const [currentLrcTime, setCurrentLrcTime] = useState()
    const [lrcLanguage, setLrcLanguage] = useState("jp")

    useEffect(() => {
        const lrc = Store.get("lrc")
        setJpLrc(lrc)
        setZhLrc(lrc)
    }, [])

    useImperativeHandle(ref, () => ({
        setMusicDetail: (info) => {
            if (currentSong == null || currentSong._id !== info._id) {
                setCurrentLrcTime(0)
                setCurrentSong(info)
            } else if (jpLrc) {
                setCurrentLrcTime(info.currentTime * 1000)
            }
        }
    }))

    const renderItem = ({active, line}) => {
        return <LyricLine content={line.content} active={active}/>
    }

    const onUpload = (file) => {
        const name = file[0].name
        const path = file[0].path
        if (name.endsWith(".lrc")) {
            const lrc = AppUtils.readFile(path).split('\n').map(item => {
                return item.trim()
            }).join('\n')
            setJpLrc(lrc)
            setZhLrc(lrc)
        }
    }

    return (
        <FileDrop
            onUpload={onUpload}
            count={1}
            formats={['']}
        >
            <div className={'lrcContainer'}>
                <Lrc
                    className="lrc"
                    style={{overflow: 'hidden !important'}}
                    lrc={lrcLanguage === 'jp' ? jpLrc : zhLrc}
                    lineRenderer={renderItem}
                    currentMillisecond={currentLrcTime}
                />
            </div>
        </FileDrop>
    )
})
