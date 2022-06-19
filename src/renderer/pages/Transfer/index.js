import React, {useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {MusicHelper} from "../../dao/MusicHelper";
import {AlbumHelper} from "../../dao/AlbumHelper";
import PQueue, {AbortError} from 'p-queue';
import {WS} from "../../utils/Websocket";
import {AppUtils} from "../../utils/AppUtils";
import {DBHelper} from "../../dao/DBHelper";
import {TransferChoose} from "../../component/TransferChoose";
import {QRDialog} from "../../component/QRDialog";

let musicIds = []
let musicList = []
let startTime = 0
let task = null;
let runningTag = 0;
let needAllTrans = false;

const Transfer = () => {
    const [qrShow, setQrShow] = useState(false)
    const [progress, setProgress] = useState(0)
    const [song, setSong] = useState("")
    const wsRef = useRef(null)
    const [phoneSystem, setPhoneSystem] = useState('android')
    const [button, setButton] = useState(0)
    const chooserRef = useRef(null)

    const mQueue = new PQueue({concurrency: 1});

    useEffect(() => {
        const task = []
        musicList.length = 0

        musicIds.map(item => {
            task.push(new Promise((resolve, reject) => {
                MusicHelper.findOneMusicByUniqueId(item).then(mMusic => {
                    AlbumHelper.findOneAlbumByAlbumId(mMusic.group, mMusic.album).then(mAlbum => {
                        resolve({
                            albumUId: mAlbum._id,
                            albumId: mAlbum.id,
                            albumName: mAlbum.name,
                            coverPath: mMusic.cover_path,
                            date: mAlbum.date,
                            category: mAlbum.category,
                            group: mAlbum.group,

                            musicUId: mMusic._id,
                            musicId: mMusic.id,
                            musicName: mMusic.name,
                            musicPath: phoneSystem === "ios" ? mMusic.music_path.replace(".flac", ".wav") : mMusic.music_path,
                            artist: mMusic.artist,
                            artistBin: mMusic.artist_bin,
                            totalTime: mMusic.time,
                            jpUrl: mMusic.lyric,
                            zhUrl: mMusic.trans,
                            romaUrl: mMusic.roma
                        })
                    })
                })
            }))
        })

        Promise.allSettled(task).then(result => {
            result.map(item => {
                musicList.push(item.value)
            })
            console.log("musicList created")
            setQrShow(false)
        })
    }, [phoneSystem])

    function toggle() {
        if (runningTag !== 0) {
            runningTag = 0
            if (task !== null) {
                task.cancel()
                task = null
            }
            mQueue.clear()
            pushQueue(musicList)
            const message = {
                cmd: "stop",
                body: ""
            }
            wsRef.current.send(JSON.stringify(message))
            setButton(0)
            return
        }
        runningTag = Date.now()
        const message = {
            cmd: "prepare",
            body: JSON.stringify(musicList) + " === " + needAllTrans
        }
        wsRef.current.send(JSON.stringify(message))
        setButton(1)
    }

    async function pushQueue(musicList) {
        if (runningTag === 0) {
            return
        }
        const pathDir = DBHelper.getHttpServer().path;
        startTime = Date.now()
        console.log('queue start');

        for (let music in musicList) {
            try {
                if (runningTag === 0) {
                    break
                }
                await mQueue.add(async () => {
                    task = AppUtils.makeCancelable(AppUtils.transfer(pathDir, musicList[music], phoneSystem, runningTag))

                    try {
                        return task.promise.then(obj => {
                            if (runningTag === obj.oldRunningTag) {
                                const isLast = parseInt(music) === (musicList.length - 1)
                                const message = {
                                    cmd: "download",
                                    body: obj.music.musicUId + " === " + isLast
                                }
                                wsRef.current.send(JSON.stringify(message))
                            }
                        }).catch(err => {
                            console.log(err)
                        })
                    } catch (error) {
                        return Promise.reject(error)
                    }
                });
            } catch (error) {
                if (!(error instanceof AbortError)) {
                    return Promise.reject(error)
                }
            }
        }

        await mQueue.onIdle()
        console.log('queue completed');
    }

    return (
        <div style={{width: "100%", height: '100%'}}>
            <TransferChoose
                btnOk={(uIdList) => {
                    musicIds.length = 0
                    musicIds = [...uIdList]
                    setQrShow(true)
                }}
                ref={chooserRef}
                changeSwitch={(checked) => needAllTrans = checked}
            />
            <QRDialog isShow={qrShow} close={() => setQrShow(false)}/>
            <WS
                // key={"websocket"}
                ref={wsRef}
                phoneSystem={setPhoneSystem}
                ready={(transIdList) => {
                    let tempList = []
                    if (needAllTrans) {
                        musicList.forEach(music => {
                            tempList.push(music)
                        })
                    } else {
                        if (transIdList.length === 0) {
                            setButton(0)
                            alert("没有任务需要传输")
                            return
                        }

                        musicList.forEach(music => {
                            transIdList.forEach(musicUId => {
                                if (music.musicUId === musicUId) {
                                    tempList.push(music)
                                }
                            })
                        })
                    }

                    if (tempList.length === 0) {
                        setButton(0)
                        alert("没有任务需要传输")
                        return
                    }

                    const message = {
                        cmd: "ready",
                        body: JSON.stringify(tempList)
                    }
                    wsRef.current.send(JSON.stringify(message))
                    pushQueue(tempList)
                }}
                downloading={(musicId, progress) => {
                    setSong(musicList.find(item => item.musicUId === musicId).musicName)
                    setProgress(progress)
                }}
                downloadSuccess={(musicId) => {
                    setProgress(100)
                }}
                downloadFail={(musicId) => {
                    if (runningTag === 0) {
                        return
                    }
                    console.log("下载失败: " + musicId)
                }}
                finish={() => {
                    console.log(Date.now() - startTime);
                    setButton(0)
                }}
            />
        </div>
    )
}

function select(store) {
    return {};
}

export default connect(select)(Transfer);
