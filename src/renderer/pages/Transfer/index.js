import React, {useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {MusicHelper} from "../../dao/MusicHelper";
import {AlbumHelper} from "../../dao/AlbumHelper";
import PQueue, {AbortError} from 'p-queue';
import {WS} from "../../utils/Websocket";
import {AppUtils} from "../../utils/AppUtils";
import QRCode from "qrcode";
import ip from "ip";
import {DBHelper} from "../../dao/DBHelper";
import {Switch} from 'antd';

let musicList = []
let startTime = 0
let task = null;
let runningTag = 0;
let needAllTrans = false;

const Transfer = () => {

    const [progress, setProgress] = useState(0)
    const [song, setSong] = useState("")
    const wsRef = useRef(null)
    const [tableData, setTableData] = useState([])
    const [phoneSystem, setPhoneSystem] = useState('android')
    const [button, setButton] = useState(0)

    const mQueue = new PQueue({concurrency: 1});

    useEffect(() => {
        setQrCode()
    }, [])

    useEffect(() => {
        const musicIds = [
            "615d5da14d33a9f9fe51be9c",
            "615d5da14d33a9f9fe51be9e",
            "615d5da14d33a9f9fe51bf26",
            "615d5da14d33a9f9fe51bf28",
            "615d5da14d33a9f9fe51bf2b",
            "615d5da14d33a9f9fe51bfdc",
            "615d5da14d33a9f9fe51bfe0",
            "615d5da14d33a9f9fe51c047",
            "615d5da14d33a9f9fe51c22c",
            "615e6faa4d33a9f9fe51c246",
            "615e6faa4d33a9f9fe51c256",
            "615e6faa4d33a9f9fe51c291",
            "615e6faa4d33a9f9fe51c2e7",
            "615e6faa4d33a9f9fe51c302",
            "615e6faa4d33a9f9fe51c3be",
            "615e6faa4d33a9f9fe51c3ed",
            "6203e745c151378148f103e2",
            "625f58dd964d387d2a164e71",
            "615d16a6b7f7a56a3a81d038",
            "615d16a6b7f7a56a3a81d03d",
            "615d16a6b7f7a56a3a81d051",
            "6166e9a630fc3915b6ab70cf",
            "615d16a6b7f7a56a3a81d045",
            "615d69c54d33a9f9fe51c23e",
            "615d16a6b7f7a56a3a81d015",
            "6268d77ee7e29bcc5c9c8995",
            "6268d7a4e7e29bcc5c9c8996",
            "615d2189b7f7a56a3a81d096",
            "615d2189b7f7a56a3a81d098",
            "615d2189b7f7a56a3a81d09b",
            "615d2189b7f7a56a3a81d09f",
            "615d2189b7f7a56a3a81d0a3",
            "61715132f5d687ee5a9d522a",
            "61aacab17880276cae325ab5",
            "621eba0db6158e130061fe01",
            "621eba0db6158e130061fe09",
            "619c85997bfe68c89a6fd96a",
            "619d9eff00757cdf3ec720f6",
            "619d9eff00757cdf3ec720f7",
            "619d9eff00757cdf3ec720f8"
        ]
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
        })
    }, [phoneSystem])

    const setQrCode = () => {
        const canvas = document.getElementById('canvas');
        QRCode.toCanvas(canvas, ip.address(), {version: 3, width: 300}, function (error) {
            if (error) console.error(error)
        })
    }

    // const columns = [
    //     {
    //         title: `传输歌曲${tableData ? tableData.length : ''}`,
    //         dataIndex: 'song',
    //         key: 'song',
    //         render: (text, record, index) => {
    //             return (
    //                 <div style={{display: 'flex', flexDirection: 'row'}}>
    //                     <p style={{margin: 0, fontWeight: 400}}>{text}</p>
    //                     <div className={'btnFuncContainer'} style={{visibility: active ? 'visible' : 'hidden'}}>
    //                         <img
    //                             className={'btnFunc'}
    //                             src={Images.ICON_DIS_PLAY}
    //                             onClick={() => console.log("click")}
    //                         />
    //                     </div>
    //                 </div>
    //             )
    //         }
    //     },
    //     {
    //         title: '艺术家',
    //         dataIndex: 'artist',
    //         key: 'artist',
    //     },
    //     {
    //         title: '时长',
    //         dataIndex: 'time',
    //         key: 'time',
    //     }
    // ];
    //
    // const renderMusicList = () => {
    //     return (
    //         <Table
    //             columns={columns}
    //             dataSource={tableData}
    //             pagination={false}
    //             onRow={onRowSelect}
    //         />
    //     )
    // }

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
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
            <canvas id="canvas"/>
            <div>
                <div style={{display: 'flex', justifyContent: 'space-around'}}>
                    <button style={{width: 100, height: 80}} onClick={toggle}>{button === 0 ? "开始" : "停止"}</button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-around', marginTop: 20}}>
                    <p style={{textAlign: 'center'}}>{song}</p>
                    <p style={{textAlign: 'center'}}>{progress}</p>
                </div>
                <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <p>是否覆盖传输？</p>
                    <Switch style={{width: 30}} onChange={(checked) => needAllTrans = checked}/>
                </div>
            </div>
            <WS
                key={"websocket"}
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
