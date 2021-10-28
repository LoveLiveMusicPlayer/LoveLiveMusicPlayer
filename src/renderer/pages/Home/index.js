import React, {useCallback, useEffect, useRef, useState} from 'react';
import './index.css'
import "animate.css"
import {Layout, InputNumber, Button, Space} from 'antd';
import {AppUtils} from "../../utils/AppUtils";
import fs from "fs";
import FileDrop from '../../component/DragAndDrop'
import {AlbumHelper} from "../../dao/AlbumHelper";
import {musicAction} from "../../actions/music";
import {HorizontalList} from "../../component/HorizontalList";
import {PrevNext, PrevNextHidden} from "./style";
import {MusicHelper} from "../../dao/MusicHelper";
import emitter from "../../utils/Event"
import {Loading} from "../../component/Loading";
import {WorkUtils} from "../../utils/WorkUtils";
import {DBHelper} from "../../dao/DBHelper";
import * as Images from "../../public/Images";
import Modal from "react-modal";

const {ipcRenderer} = require("electron")
const {connect} = require('react-redux');
const {Content} = Layout;

const Home = ({dispatch, chooseGroup, openSetHttpInput}) => {
    // 第一行专辑列表引用
    let topRef = useRef()
    // 第二行专辑列表引用
    let bottomRef = useRef()
    // Loading 窗口引用
    let loadingRef = useRef()

    // 屏幕宽度
    const [width, setWidth] = useState(window.innerWidth)
    // 专辑列表
    const [albumList, setAlbumList] = useState({})
    // 当前选中的企划
    const [group, setGroup] = useState(chooseGroup)
    // 导入专辑json时对列表进行刷新
    const [refresh, setRefresh] = useState()
    // 左侧翻页按钮是否显示
    const [activeLeftButton, setActiveLeftButton] = useState(false)
    // 右侧翻页按钮是否显示
    const [activeRightButton, setActiveRightButton] = useState(true)
    // HTTP服务的 IP + 端口 地址
    const [URL, setURL] = useState("http://localhost:10000/")
    // 显示HTTP端口输入框
    const [portInputVisible, setPortInputVisible] = useState(false)
    const [port, setPort] = useState(10000)
    const [rootDir, setRootDir] = useState()
    // 判断是否选中了Logo的时间戳
    const [httpInputTime, setHttpInputTime] = useState(new Date().getTime())
    // 设置http端口等待两秒时的按钮状态
    const [wait, setWait] = useState(false)

    /**
     * 生命周期以及定时器的声明与销毁
     */
    useEffect(() => {
        // 如果之前有保存http服务地址，直接载入
        DBHelper.findHttpServer().then(rootDir => {
            if (rootDir) {
                setHttpServer(rootDir)
            }
        })
        // 监听窗口改变大小
        const listener = function () {
            let width = window.innerWidth
            const height = window.innerHeight
            const radio = 1025 / 648
            if (width / height > radio) {
                width = height * radio
            }
            setWidth(width)
        }
        window.addEventListener("resize", listener)

        // 接收提示窗口关闭的回调
        ipcRenderer.on('msgDialogCallback', (event, arg) => {
            console.log("弹窗关闭")
        })

        // 设置http服务回调
        ipcRenderer.on("openHttpReply", (event, args) => {
            console.log(args)
            setURL(`http://localhost:${args}/`)
        })

        return () => {
            // 生命周期结束后将监听器移除
            window.removeEventListener("resize", listener)
        }
    }, [])

    /**
     * 企划变更或者导入专辑列表刷新触发
     */
    useEffect(() => {
        topRef.current?.toFirst()
        bottomRef.current?.toFirst()
        setActiveLeftButton(false)
        // 切换企划时从数据库加载对应的全部专辑
        AlbumHelper.findAllAlbumsByGroup(group).then(res => {
            const topList = []
            const bottomList = []
            res?.map((item, index) => {
                const album = []
                if (index % 2 === 0) {
                    item["cover_path"].map(src => {
                        album.push({
                            id: item._id,
                            src: URL + src,
                            text: item.name
                        })
                    })
                    topList.push(album)
                } else {
                    item["cover_path"].map(src => {
                        album.push({
                            id: item._id,
                            src: URL + src,
                            text: item.name
                        })
                    })
                    bottomList.push(album)
                }
            })
            setActiveRightButton((topList.length + bottomList.length) > 10)
            setAlbumList({
                top: topList,
                bottom: bottomList
            })
        }).catch(err => {
            console.log(err)
        })
    }, [group, refresh])

    // 打开HTTP文件服务
    const setHttpServer = (rootDir) => {
        setRootDir(rootDir)
        ipcRenderer.invoke('openHttp', [rootDir, port])
    }

    /**
     * 导入LoveLive文件夹、albumList.json专辑、musicList.json音乐
     * @param file
     * @returns {Promise<void>}
     */
    const onUpload = async (file) => {
        const name = file[0].name
        const path = file[0].path
        if (name === "LoveLive" && fs.lstatSync(path).isDirectory()) {
            const rootDir = AppUtils.delLastSameString(path, name)
            setHttpServer(rootDir)
            await DBHelper.insertOrUpdateHttpServer(rootDir)
            alert("导入歌曲库成功")
            // await WorkUtils.exportToExcel(path, rootDir)
        } else if (name === "albumList.json") {
            // 传入了专辑 json
            try {
                loadingRef.current?.show()
                const json = fs.readFileSync(path, {encoding: "utf-8"})
                AlbumHelper.insertOrUpdateAlbum(json, function (progress) {
                    loadingRef.current?.setProgress(progress)
                }).then(_ => {
                    setRefresh(new Date().getTime())
                    setTimeout(() => {
                        loadingRef.current?.hide()
                    }, 1000)
                })
            } catch (e) {
                loadingRef.current?.hide()
                alert("导入专辑列表失败")
            }
        } else if (name === "musicList.json") {
            // 传入了歌曲 json
            try {
                loadingRef.current?.show()
                const json = fs.readFileSync(path, {encoding: "utf-8"})
                MusicHelper.insertOrUpdateMusic(json, function (progress) {
                    loadingRef.current?.setProgress(progress)
                }).then(_ => {
                    setTimeout(() => {
                        loadingRef.current?.hide()
                    }, 1000)
                })
            } catch (e) {
                loadingRef.current?.hide()
                alert("导入音乐列表失败")
            }
        } else {
            alert("拖入的文件异常，请检查")
        }
    }

    /**
     * 翻页时触发的回调，用于更新状态
     * @type {(function(*): void)|*}
     */
    const onPageClick = useCallback((e) => {
        e.preventDefault();
        const {type} = e.target
        if (type === 'prev') {
            topRef.current?.prev()
            bottomRef.current?.prev()
            setActiveRightButton(true)
        } else if (type === 'next') {
            topRef.current?.next()
            bottomRef.current?.next()
            setActiveLeftButton(true)
        }
    }, []);

    /**
     * 当选择了一个专辑，需要获取对应的歌曲列表并设置在播放器上
     * @param e
     * @returns {Promise<void>}
     */
    const chooseItem = async (e) => {
        AlbumHelper.findOneAlbumById(e).then(res => {
            // ipcRenderer.send('msgDialog', "选择了: " + res.name)
            const promiseArr = []
            res.music.map(id => {
                promiseArr.push(MusicHelper.findOneMusic(id, res.group))
            })
            let isLoaded = true
            Promise.allSettled(promiseArr).then(res => {
                const audioList = []
                res.map(item => {
                    if (item.value != null) {
                        audioList.push({
                            name: item.value.name,
                            singer: item.value.artist,
                            cover: AppUtils.encodeURL(URL + item.value["cover_path"]),
                            musicSrc: AppUtils.encodeURL(URL + item.value["music_path"])
                        })
                    } else {
                        isLoaded = false
                    }
                })
                if (isLoaded) {
                    emitter.emit("onChangeAudioList", audioList)
                } else {
                    alert("存在损坏的数据，请重新导入")
                }
            })
        })
    }

    // 滚动到专辑列表首页
    const onScrollFirst = () => {
        setActiveLeftButton(false)
    }

    // 滚动到专辑列表尾页
    const onScrollLast = () => {
        setActiveRightButton(false)
    }

    // 当选择了企划时将触发redux保存并获取企划数据
    const refreshAlbum = (gp) => {
        if (gp !== group) {
            setGroup(gp)
            dispatch(musicAction.chooseGroup(gp))
        }
    }

    const refreshHttpPortInput = (time) => {
        if (time !== httpInputTime) {
            setHttpInputTime(time)
            if (time > new Date().getTime()) {
                setPortInputVisible(true)
            }
        }
    }

    // 根据状态渲染左边的箭头
    const renderLeftArrow = () => {
        if (activeLeftButton) {
            return <PrevNext type={'prev'} onClick={onPageClick}>&#10094;</PrevNext>
        } else {
            return <PrevNextHidden type={'prev'}>&#10094;</PrevNextHidden>
        }
    }

    // 根据状态渲染右边的箭头
    const renderRightArrow = (margin) => {
        if (activeRightButton) {
            return <PrevNext type={'next'} onClick={onPageClick} margin={margin}>&#10095;</PrevNext>
        } else {
            return <PrevNextHidden type={'next'}>&#10095;</PrevNextHidden>
        }
    }

    // 渲染专辑列表UI
    const renderMusicGallery = () => {
        const margin = Number(width / 37.5) / 2 + "px"
        return (
            <div className={"musicGalleryContainer"}>
                <>
                    {
                        albumList.top && albumList.top.length > 0 ?
                            <>
                                {renderLeftArrow()}
                                <div className={"musicGalleryList"}>
                                    <HorizontalList
                                        ref={topRef}
                                        width={width}
                                        album={albumList.top}
                                        another={albumList.bottom}
                                        chooseItem={chooseItem}
                                        onScrollFirst={onScrollFirst}
                                        onScrollLast={onScrollLast}
                                    />
                                    <HorizontalList
                                        ref={bottomRef}
                                        width={width}
                                        album={albumList.bottom}
                                        another={albumList.top}
                                        chooseItem={chooseItem}
                                    />
                                </div>
                                {renderRightArrow(margin)}
                            </> : null
                    }
                </>
            </div>
        )
    }

    const customStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.60)'
        },
        content: {
            width: 300,
            height: 150,
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-around',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translate(-50%, -50%)',
        },
    };

    // 渲染输入HTTP端口的窗口
    const renderHttpPortInput = () => {
        return (
            <Modal
                isOpen={portInputVisible}
                onAfterOpen={null}
                onRequestClose={() => {
                    setPortInputVisible(false)
                }}
                style={customStyles}>
                <p style={{fontWeight: 'bold'}}>请输入端口号</p>
                <Space>
                    <InputNumber
                        min={10000}
                        max={65535}
                        value={port}
                        defaultValue={10000}
                        onChange={setPort}
                    />
                    <Button
                        type="primary"
                        loading={wait}
                        onClick={() => {
                            if (port < 10000) {
                                setPort(10000)
                            } else if (port > 65535) {
                                setPort(65535)
                            } else {
                                // 只有在 10000-65535 区间内的端口才允许设置
                                setWait(true)
                                setHttpServer(rootDir)
                                setTimeout(() => {
                                    setWait(false)
                                    setRefresh(new Date().getTime())
                                    setPortInputVisible(false)
                                }, 2000)
                            }
                        }}
                    >
                        确定
                    </Button>
                </Space>
            </Modal>
        )
    }

    return (
        <FileDrop
            onUpload={onUpload}
            count={1}
            formats={['']}
        >
            {chooseGroup && refreshAlbum(chooseGroup)}
            {openSetHttpInput && refreshHttpPortInput(openSetHttpInput)}
            <Content className="container">
                {renderMusicGallery()}
                <Loading ref={loadingRef}/>
            </Content>
            { portInputVisible ? renderHttpPortInput() : null }
        </FileDrop>
    );
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
        openSetHttpInput: store.music.openSetHttpInput,
    };
}

export default connect(select)(Home);
