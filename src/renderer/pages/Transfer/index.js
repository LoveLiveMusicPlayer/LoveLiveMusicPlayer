import React, {useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {MusicHelper} from "../../dao/MusicHelper";
import {AlbumHelper} from "../../dao/AlbumHelper";
import {WS} from "../../utils/Websocket";
import {DBHelper} from "../../dao/DBHelper";
import {TransferChoose} from "../../component/TransferChoose";
import {QRDialog} from "../../component/QRDialog";
import Store from "../../utils/Store";
import {DownloadDialog} from "../../component/DownloadDialog";
import {ipcRenderer} from "electron";
import fs from "fs";
import path from 'path'
import {AppUtils} from "../../utils/AppUtils";
import checkDiskSpace from 'check-disk-space'
import {notification} from 'antd';

let musicIds = []
let musicList = []
let startTime = 0
let runningTag = 0;
let needAllTrans = false;
let useLocalMusic = false;

const Transfer = () => {
    const [qrShow, setQrShow] = useState(false)
    const [downloadShow, setDownloadShow] = useState(false)
    const wsRef = useRef(null)
    const downloadRef = useRef(null)

    const genList = (phoneSystem) => {
        Store.set("phoneSystem", phoneSystem)
        const task = []
        musicList.length = 0

        musicIds.map(item => {
            task.push(new Promise((resolve, reject) => {
                MusicHelper.findOneMusicByUniqueId(item).then(mMusic => {
                    const convertPath = mMusic.music_path.replaceAll('/', path.sep)
                    const url = DBHelper.getHttpServer().path + convertPath
                    if (fs.existsSync(url)) {
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
                                convertPath: convertPath,
                                musicPath: phoneSystem === "ios" ? mMusic.music_path.replace(".flac", ".wav") : mMusic.music_path,
                                artist: mMusic.artist,
                                artistBin: mMusic.artist_bin,
                                totalTime: mMusic.time,
                                jpUrl: mMusic.lyric,
                                zhUrl: mMusic.trans,
                                romaUrl: mMusic.roma
                            })
                        })
                    } else {
                        resolve(undefined)
                    }
                })
            }))
        })

        Promise.allSettled(task).then(result => {
            result.map(item => {
                // 去掉本地没有的文件
                if (item.value !== undefined) {
                    musicList.push(item.value)
                }
            })
            console.log("musicList created")
            setQrShow(false)
            if (useLocalMusic) {
                onlyTransJsonData()
            } else {
                prepareTask()
            }
        })
    }

    useEffect(() => {
        checkDiskSpace(DBHelper.getHttpServer().path).then((diskSpace) => {
            const mb = diskSpace.free / 1024 / 1024;
            if (mb <= 50) {
                notification.open({
                    message: '请注意',
                    description: '目前歌曲包所在硬盘的剩余空间不足50M，如果使用IOS设备进行歌曲传输，可能会存在失败的可能性',
                    duration: 0
                });
            }
        });

        ipcRenderer.on('convertOver', (event, args) => {
            const message = JSON.parse(args)
            if (message.cmd === "download") {
                wsRef.current?.send(args)
            } else {
                downloadRef.current?.setProgress({
                    musicId: message.body,
                    progress: message.cmd
                })
            }
        })
    }, [])

    /**
     * 仅对设备传输json数据，不传输歌曲
     */
    function onlyTransJsonData() {
        const message = {
            cmd: "noTrans",
            body: JSON.stringify(musicList)
        }
        wsRef.current?.send(JSON.stringify(message))
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
            ipcRenderer.send('stopConvert')
            const message = {
                cmd: "stop",
                body: ""
            }
            wsRef.current?.send(JSON.stringify(message))
        }
    }

    function pushQueue(musicList, phoneSystem) {
        if (runningTag === 0) {
            return
        }
        const pathDir = DBHelper.getHttpServer().path;
        startTime = Date.now()
        console.log('queue start');
        const message = {pathDir, musicList, phoneSystem, runningTag}
        ipcRenderer.send('doConvert', JSON.stringify(message))
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
                useLocalMusic={(checked) => useLocalMusic = checked}
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
                    let message = {
                        cmd: "back",
                        body: ""
                    }
                    if (needAllTrans) {
                        musicList.forEach(music => {
                            tempList.push(music)
                        })
                    } else {
                        if (transIdList.length === 0) {
                            wsRef.current?.send(JSON.stringify(message))
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
                        wsRef.current?.send(JSON.stringify(message))
                        alert("没有任务需要传输")
                        return
                    }

                    message = {
                        cmd: "ready",
                        body: JSON.stringify(tempList)
                    }
                    downloadRef.current?.setList(tempList)
                    setDownloadShow(true)
                    wsRef.current?.send(JSON.stringify(message))
                    pushQueue(tempList, Store.get("phoneSystem", "android"))
                }}
                downloading={(musicId) => {
                    downloadRef.current?.setProgress({
                        musicId: musicId,
                        progress: "下载中"
                    })
                }}
                downloadSuccess={(musicId) => {
                    downloadRef.current?.setProgress({
                        musicId: musicId,
                        progress: "下载完成"
                    })
                    if (Store.get("phoneSystem", "android") === "ios") {
                        let musicList = downloadRef.current?.getList().filter(item => item.musicUId === musicId)
                        if (musicList.length > 0) {
                            AppUtils.delFile(DBHelper.getHttpServer().path + musicList[0].musicPath)
                        }
                    }
                }}
                downloadFail={(musicId) => {
                    if (runningTag === 0) {
                        return
                    }
                    downloadRef.current?.setProgress({
                        musicId: musicId,
                        progress: "下载失败"
                    })
                    console.log("下载失败: " + musicId)
                }}
                finish={() => {
                    console.log(Date.now() - startTime);
                    stopTask()
                    setDownloadShow(false)
                }}
                stop={() => {
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
