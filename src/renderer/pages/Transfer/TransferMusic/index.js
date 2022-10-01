import React, {useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {MusicHelper} from "../../../dao/MusicHelper";
import {AlbumHelper} from "../../../dao/AlbumHelper";
import {WS_Music} from "../../../utils/WsMusic";
import {DBHelper} from "../../../dao/DBHelper";
import {TransferChoose} from "../../../component/TransferChoose";
import {QRDialog} from "../../../component/QRDialog";
import Store from "../../../utils/Store";
import {DownloadDialog} from "../../../component/DownloadDialog";
import {ipcRenderer} from "electron";
import fs from "fs";
import path from 'path'
import {AppUtils} from "../../../utils/AppUtils";
import checkDiskSpace from 'check-disk-space'
import {notification} from 'antd';
import {WorkUtils} from "../../../utils/WorkUtils";

let musicIds = []
let musicList = []
let startTime = 0
let runningTag = 0;
let needAllTrans = false;
let choosePlatform = null;
let useLocalMusic = false;

let directoryListener;
let convertListener;

const TransferMusic = () => {
    const [qrShow, setQrShow] = useState(false)
    const [scanSuccess, setScanSuccess] = useState(false)
    const [downloadShow, setDownloadShow] = useState(false)
    const wsRef = useRef(null)
    const downloadRef = useRef(null)

    const genList = (phoneSystem, dest) => {
        Store.set("phoneSystem", phoneSystem)
        const task = []
        musicList.length = 0

        musicIds.map(item => {
            task.push(new Promise((resolve, reject) => {
                MusicHelper.findOneMusicByUniqueId(item).then(mMusic => {
                    let convertPath = (mMusic.base_url + mMusic.music_path).replaceAll('/', path.sep)
                    const url = DBHelper.getHttpServer().path + path.sep + convertPath
                    if (phoneSystem === "ios") {
                        convertPath = convertPath.replace(".flac", ".wav")
                    }
                    if (fs.existsSync(url)) {
                        AlbumHelper.findOneAlbumByAlbumId(mMusic.group, mMusic.album).then(mAlbum => {
                            let destDir = null
                            if (dest !== undefined) {
                                const srcDirArr = AppUtils.getFileDirectory(url).split(path.sep + 'LoveLive' + path.sep)
                                console.log(srcDirArr)
                                destDir = dest + path.sep + "LoveLive" + path.sep + srcDirArr[srcDirArr.length - 1].replaceAll('/', path.sep)
                            }

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
                                musicPath: mMusic.music_path,
                                destDir: destDir,
                                artist: mMusic.artist,
                                artistBin: mMusic.artist_bin,
                                totalTime: mMusic.time,
                                baseUrl: mMusic.base_url
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
                return;
            }
            if (choosePlatform == null) {
                prepareTask()
                return;
            }
            runningTag = Date.now()
            downloadRef.current?.setList(musicList)
            setDownloadShow(true)
            pushQueue(musicList, choosePlatform)
        })
    }

    useEffect(() => {
        checkDiskSpace(DBHelper.getHttpServer().path).then(diskSpace => {
            const mb = diskSpace.free / 1024 / 1024;
            if (mb <= 50) {
                notification.open({
                    message: '请注意',
                    description: '目前歌曲包所在硬盘的剩余空间不足50M，如果使用IOS设备进行歌曲传输，可能会存在失败的可能性',
                    duration: 0
                });
            }
        });

        directoryListener = (event, result) => {
            if (result !== undefined) {
                checkDiskSpace(result[0]).then(diskSpace => {
                    const destPath = result[0] + path.sep + "output"
                    if (!fs.existsSync(destPath)) {
                        fs.mkdirSync(destPath)
                    }
                    onlyExportMusic(destPath, diskSpace.free)
                })
            }
        }

        convertListener = (event, args) => {
            const message = JSON.parse(args)
            if (message.cmd === "download") {
                if (choosePlatform == null) {
                    wsRef.current?.send(args)
                } else if (message.body.indexOf(" === ") !== -1) {
                    const splitArr = message.body.split(" === ")
                    downloadRef.current?.setProgress({
                        musicId: splitArr[0],
                        progress: choosePlatform === "ios" ? "转换完成" : "复制完成"
                    })
                    if (splitArr[1] === "true") {
                        setDownloadShow(false)
                    }
                }
            } else {
                downloadRef.current?.setProgress({
                    musicId: message.body,
                    progress: message.cmd
                })
            }
        }

        ipcRenderer.on('directoryTransferDialog', directoryListener)

        ipcRenderer.on('convertOver', convertListener)

        return () => {
            ipcRenderer.removeListener("directoryTransferDialog", directoryListener)
            ipcRenderer.removeListener("convertOver", convertListener)
        }
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

    async function onlyExportMusic(dest, freeRom) {
        let totalSize = 0;
        let errorMsg = null;
        for (let i = 0; i < musicIds.length; i++) {
            if (totalSize > freeRom) {
                errorMsg = "可用磁盘空间不足"
                break
            }
            if (errorMsg != null) {
                break
            }

            const music = await MusicHelper.findOneMusicByUniqueId(musicIds[i]);
            const musicPath = (music.base_url + music.music_path).replaceAll('/', path.sep)
            let url = DBHelper.getHttpServer().path + musicPath
            if (fs.existsSync(url)) {
                WorkUtils.calcSizeSync(url, (err, size) => {
                    if (err) {
                        errorMsg = err.message
                    } else {
                        totalSize += size
                    }
                })
            }
            const musicCoverPath = (music.base_url + music.cover_path).replaceAll('/', path.sep)
            url = DBHelper.getHttpServer().path + musicCoverPath
            if (fs.existsSync(url)) {
                WorkUtils.calcSizeSync(url, (err, size) => {
                    if (err) {
                        errorMsg = err.message
                    } else {
                        totalSize += (size * choosePlatform === "android" ? 1 : 1.5)
                    }
                })
            }
        }
        if (errorMsg != null) {
            AppUtils.openMsgDialog("error", errorMsg)
            return
        }
        genList(choosePlatform, dest)
    }

    function prepareTask() {
        runningTag = Date.now()
        const message = {
            cmd: "prepare",
            body: JSON.stringify(musicList) + " === " + needAllTrans
        }
        wsRef.current?.send(JSON.stringify(message))
    }

    function stopTask(needSend = true) {
        if (runningTag !== 0) {
            runningTag = 0
            ipcRenderer.send('stopConvert')
            if (needSend) {
                const message = {
                    cmd: "stop",
                    body: ""
                }
                wsRef.current?.send(JSON.stringify(message))
            }
        }
    }

    function pushQueue(musicList, phoneSystem) {
        if (runningTag === 0) {
            return
        }
        const pathDir = DBHelper.getHttpServer().path + path.sep;
        startTime = Date.now()
        console.log('queue start');
        const message = {pathDir, musicList, phoneSystem, runningTag}
        ipcRenderer.send('doConvert', JSON.stringify(message))
    }

    return (
        <div style={{width: "100%", height: '100%'}}>
            <TransferChoose
                btnWIFI={(uIdList) => {
                    musicIds.length = 0
                    musicIds = [...uIdList]
                    choosePlatform = null
                    setQrShow(true)
                }}
                disable={qrShow || downloadShow}
                changeSwitch={(checked) => needAllTrans = checked}
                // useLocalMusic={(checked) => useLocalMusic = checked}
                btnUSB={(uIdList, platform) => {
                    musicIds.length = 0
                    musicIds = [...uIdList]
                    choosePlatform = platform
                    ipcRenderer.invoke('directoryTransferDialog')
                }}
                progress
            />
            <QRDialog isShow={qrShow} close={() => {
                const message = {
                    cmd: "stop",
                    body: ""
                }
                wsRef.current?.send(JSON.stringify(message))
                setQrShow(false)
                setScanSuccess(false)
            }} isSuccess={scanSuccess}/>
            <DownloadDialog isShow={downloadShow} onClose={() => {
                setDownloadShow(false)
                stopTask()
            }} ref={downloadRef}/>
            <WS_Music
                ref={wsRef}
                phoneSystem={(system) => {
                    setScanSuccess(true)
                    genList(system)
                }}
                ready={(transIdList) => {
                    setScanSuccess(false)
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
                            const delFilePath = DBHelper.getHttpServer().path + path.sep + musicList[0].baseUrl + musicList[0].musicPath
                            AppUtils.delFile(delFilePath.replaceAll('/', path.sep).replace(".flac", ".wav"))
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
                    stopTask(false)
                    setDownloadShow(false)
                }}
            />
        </div>
    )
}

function select(store) {
    return {};
}

export default connect(select)(TransferMusic);
