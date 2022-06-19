import React, {useRef, useState} from "react";
import {connect} from "react-redux";
import {MusicHelper} from "../../dao/MusicHelper";
import {AlbumHelper} from "../../dao/AlbumHelper";
import PQueue, {AbortError} from 'p-queue';
import {WS} from "../../utils/Websocket";
import {AppUtils} from "../../utils/AppUtils";
import {DBHelper} from "../../dao/DBHelper";
import {TransferChoose} from "../../component/TransferChoose";
import {QRDialog} from "../../component/QRDialog";
import Store from "../../utils/Store";
import {DownloadDialog} from "../../component/DownloadDialog";

let musicIds = []
let musicList = []
let startTime = 0
let task = null;
let runningTag = 0;
let needAllTrans = false;

const Transfer = () => {
    const [qrShow, setQrShow] = useState(false)
    const [downloadShow, setDownloadShow] = useState(false)
    const wsRef = useRef(null)
    const downloadRef = useRef(null)

    const mQueue = new PQueue({concurrency: 1});

    const genList = (phoneSystem) => {
        Store.set("phoneSystem", phoneSystem)
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
            prepareTask()
        })
    }

    function prepareTask() {
        runningTag = Date.now()
        const message = {
            cmd: "prepare",
            body: JSON.stringify(musicList) + " === " + needAllTrans
        }
        wsRef.current?.send(JSON.stringify(message))
    }

    function stopTask() {
        if (runningTag !== 0) {
            runningTag = 0
            if (task !== null) {
                task.cancel()
                task = null
            }
            mQueue.clear()
            const message = {
                cmd: "stop",
                body: ""
            }
            wsRef.current?.send(JSON.stringify(message))
        }
    }

    async function pushQueue(musicList, phoneSystem) {
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
                                wsRef.current?.send(JSON.stringify(message))
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
                disable={qrShow || downloadShow}
                changeSwitch={(checked) => needAllTrans = checked}
                progress
            />
            <QRDialog isShow={qrShow} close={() => setQrShow(false)}/>
            <DownloadDialog isShow={downloadShow} onClose={() => {
                setDownloadShow(false)
                stopTask()
            }} ref={downloadRef}/>
            <WS
                ref={wsRef}
                phoneSystem={genList}
                ready={(transIdList) => {
                    let tempList = []
                    if (needAllTrans) {
                        musicList.forEach(music => {
                            tempList.push(music)
                        })
                    } else {
                        if (transIdList.length === 0) {
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
                        alert("没有任务需要传输")
                        return
                    }

                    const message = {
                        cmd: "ready",
                        body: JSON.stringify(tempList)
                    }
                    downloadRef.current?.setList(tempList)
                    setDownloadShow(true)
                    wsRef.current?.send(JSON.stringify(message))
                    pushQueue(tempList, Store.get("phoneSystem", "android"))
                }}
                downloading={(musicId, progress) => {
                    downloadRef.current?.setProgress({
                        musicId: musicId,
                        progress: progress
                    })
                }}
                downloadSuccess={(musicId) => {
                    downloadRef.current?.setProgress({
                        musicId: musicId,
                        progress: 100
                    })
                }}
                downloadFail={(musicId) => {
                    if (runningTag === 0) {
                        return
                    }
                    console.log("下载失败: " + musicId)
                }}
                finish={() => {
                    console.log(Date.now() - startTime);
                    stopTask()
                    setDownloadShow(false)
                }}
            />
        </div>
    )
}

function select(store) {
    return {};
}

export default connect(select)(Transfer);
