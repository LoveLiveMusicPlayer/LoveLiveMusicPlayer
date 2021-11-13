import React, {forwardRef, useImperativeHandle, useState} from 'react';
import './index.scss'
import {Lrc} from 'react-lrc';
import LyricLine from './LyricLine'

export const MusicDetail = forwardRef((props, ref) => {
    const [currentSong, setCurrentSong] = useState()
    const [jpLrc, setJpLrc] = useState('')
    const [zhLrc, setZhLrc] = useState('')
    const [currentLrcTime, setCurrentLrcTime] = useState()
    const [lrcLanguage, setLrcLanguage] = useState("jp")

    // useEffect(() => {
    //     if (currentSong) {
    //         Network.post(`https://music.163.com/api/search/get?s=${currentSong.name}&type=1&limit=10&offset=0`).then(res => {
    //             if (res.data.result) {
    //                 const musicId = res.data.result.songs[0].id
    //                 console.log("歌曲id: " + musicId)
    //                 Network.post(`https://music.163.com/api/song/lyric?id=${musicId}&lv=-1&kv=-1&tv=-1`).then(res => {
    //                     if (res.data.lrc) {
    //                         setJpLrc(res.data.lrc.lyric)
    //                     }
    //                     if (res.data.tlyric) {
    //                         setZhLrc(res.data.tlyric.lyric)
    //                     }
    //                 })
    //             }
    //         })
    //     }
    // }, [currentSong])

    useImperativeHandle(ref, () => ({
        setMusicDetail: (info) => {
            if (currentSong == null || currentSong._id !== info._id) {
                setCurrentLrcTime(0)
                setCurrentSong(info)
            } else if (jpLrc) {
                setCurrentLrcTime(info.currentTime * 1000)
            }
        },

        setLrc: (lrc) => {
            setJpLrc(lrc)
            setZhLrc(lrc)
        }
    }))

    const renderItem = ({active, line}) => {
        return <LyricLine content={line.content} active={active}/>
    }

    return (
        <div>
            <div className={'lrcContainer'}>
                <Lrc
                    className="lrc"
                    style={{overflow: 'hidden !important'}}
                    lrc={lrcLanguage === 'jp' ? jpLrc : zhLrc}
                    lineRenderer={renderItem}
                    currentMillisecond={currentLrcTime}
                />
            </div>
        </div>
    )
})
