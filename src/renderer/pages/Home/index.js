import React, {useCallback, useEffect, useRef, useState} from 'react';
import Store from "../../utils/Store"
import './index.css'
import "animate.css"
import {Button, Dropdown, Empty, InputNumber, Layout, Menu, Space} from 'antd';
import {AppUtils} from "../../utils/AppUtils";
import fs from "fs";
import FileDrop from '../../component/DragAndDrop'
import {AlbumHelper} from "../../dao/AlbumHelper";
import {musicAction} from "../../actions/music";
import {HorizontalList} from "../../component/HorizontalList";
import {PrevNext, PrevNextHidden} from "./style";
import {MusicHelper} from "../../dao/MusicHelper";
import Bus from "../../utils/Event"
import {Loading} from "../../component/Loading";
import {DBHelper} from "../../dao/DBHelper";
import Modal from "react-modal";
import * as Images from "../../public/Images";
import {ColorPicker} from "../../component/ColorPicker";
import {WorkUtils} from "../../utils/WorkUtils";

const {ipcRenderer} = require("electron")
const {connect} = require('react-redux');
const {Content} = Layout;

const Home = ({dispatch, chooseGroup}) => {
    // 第一行专辑列表引用
    let topRef = useRef()
    // 第二行专辑列表引用
    let bottomRef = useRef()
    // Loading 窗口引用
    let loadingRef = useRef()

    let colorPickerRef = useRef()

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
    // HTTP服务的端口号
    const [port, setPort] = useState(10000)
    // HTTP服务要加载的目录
    const [rootDir, setRootDir] = useState()
    // 设置http端口等待两秒时的按钮状态
    const [wait, setWait] = useState(false)

    /**
     * 生命周期以及定时器的声明与销毁
     */
    useEffect(() => {
        setTimeout(() => {
            Bus.emit("onShowInfoNotification", '这是一个开源项目，完全免费！')
        }, 1000)

        // 如果之前有保存http服务地址，直接载入
        DBHelper.getHttpServer().then(info => {
            if (info) {
                setHttpServer({path: info.serverPath, port: info.serverPort})
            }
        })

        // 监听窗口改变大小
        const listener = function () {
            let width = window.innerWidth
            const height = window.innerHeight
            const radio = 1025 / 648
            // 防止在横向变宽时，图片变大
            if (width / height > radio) {
                width = height * radio
            }
            setWidth(width)
        }

        const onTapLogoListener = function () {
            setPortInputVisible(true)
        }

        // 接收提示窗口关闭的回调
        ipcRenderer.on('msgDialogCallback', (event, arg) => {
            console.log("弹窗关闭")
        })

        // 设置http服务回调
        ipcRenderer.on("openHttpReply", (event, path, port) => {
            DBHelper.setHttpServer({path: path, port: port}).then(_ => {
                setRootDir(path)
                setPort(port)
                setURL(`http://localhost:${port}/`)
                setRefresh(new Date().getTime())
            })
        })

        // 添加窗口大小变化监听器
        window.addEventListener("resize", listener)

        // 添加触摸Logo监听器
        Bus.addListener("onTapLogo", onTapLogoListener)

        return () => {
            // 生命周期结束后将监听器移除
            window.removeEventListener("resize", listener)
            removeEventListener("onTapLogo", onTapLogoListener)
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
        })
    }, [group, refresh])

    // 打开HTTP文件服务
    const setHttpServer = (info) => {
        ipcRenderer.invoke('openHttp', info.path, info.port)
    }

    /**
     * 导入LoveLive文件夹
     * @param file
     * @returns {Promise<void>}
     */
    const onUpload = async (file) => {
        const name = file[0].name
        const path = file[0].path
        if (name === "LoveLive" && fs.lstatSync(path).isDirectory()) {
            const rootDir = AppUtils.delLastSameString(path, name)
            setHttpServer({path: rootDir, port: port})
            AppUtils.openMsgDialog("info", "导入歌曲库成功")
            // await WorkUtils.exportToExcel(path, rootDir)
        } else {
            AppUtils.openMsgDialog("error", "请拖入名为LoveLive的文件夹")
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

    const putArrToPlayer = (promiseArr) => {
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
                Bus.emit("onChangeAudioList", audioList)
            } else {
                AppUtils.openMsgDialog("error", "存在损坏的数据，请重新更新数据")
            }
        })
    }

    /**
     * 当选择了一个专辑，需要获取对应的歌曲列表并设置在播放器上
     * @param e
     * @returns {Promise<void>}
     */
    const chooseItem = async (e) => {
        AlbumHelper.findOneAlbumById(e).then(res => {
            const promiseArr = []
            res.music.map(id => {
                promiseArr.push(MusicHelper.findOneMusic(id, res.group))
            })
            putArrToPlayer(promiseArr)
        })
    }

    const randomPlay = () => {
        AlbumHelper.findAllAlbumsByGroup(group).then(albumList => {
            const promiseArr = []
            albumList.map(item => {
                item.music.map(id => {
                    promiseArr.push(MusicHelper.findOneMusic(id, item.group))
                })
            })
            putArrToPlayer(promiseArr)
        })
    }

    const refreshData = async () => {
        const dataUrl = await WorkUtils.requestUrl()
        if (dataUrl == null) {
            AppUtils.openMsgDialog("error", "服务繁忙，请稍候再试")
            return
        }
        const data = await WorkUtils.requestData(dataUrl)
        if (data == null) {
            AppUtils.openMsgDialog("error", "服务繁忙，请稍候再试")
            return
        }
        const version = Store.get("dataVersion")
        if (version && version >= data.version) {
            AppUtils.openMsgDialog("info", "已是最新数据，无需更新")
            return
        }
        loadingRef.current?.show()
        loadingRef.current?.setTitle("导入专辑中..")
        AlbumHelper.insertOrUpdateAlbum(JSON.stringify(data.album), function (progress) {
            loadingRef.current?.setProgress(progress)
        }).then(_ => {
            loadingRef.current?.setTitle("导入歌曲中..")
            MusicHelper.insertOrUpdateMusic(JSON.stringify(data.music), function (progress) {
                loadingRef.current?.setProgress(progress)
            }).then(_ => {
                Store.set("dataVersion", data.version)
                setRefresh(new Date().getTime())
                setTimeout(() => {
                    loadingRef.current?.hide()
                }, 1000)
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
                            </> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
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
                appElement={document.body}
                isOpen={portInputVisible}
                onAfterOpen={null}
                onRequestClose={() => setPortInputVisible(false)}
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
                            if (port < 10000 || port > 65535) {
                                setPort(10000)
                            } else {
                                // 只有在 10000-65535 区间内的端口才允许设置
                                setWait(true)
                                setHttpServer({path: rootDir, port: port})
                                setTimeout(() => {
                                    setWait(false)
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

    const menu = (
        <Menu>
            <Menu.Item key={"port"}>
                <a onClick={() => Bus.emit("onTapLogo")}>设置端口</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"theme"}>
                <a onClick={() => colorPickerRef.current?.open()}>设置主题</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"randomPlay"}>
                <a onClick={randomPlay}>全部播放</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"refreshData"}>
                <a onClick={refreshData}>更新数据</a>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"checkUpdate"}>
                <a onClick={() => ipcRenderer.invoke('checkUpdate')}>检查更新</a>
            </Menu.Item>
        </Menu>
    )

    const onColorPickerChange = (color1, color2) => {
        Bus.emit("onBodyChangeColor", {color1: color1, color2: color2})
    }

    return (
        <FileDrop
            onUpload={onUpload}
            count={1}
            formats={['']}
        >
            {chooseGroup != null && refreshAlbum(chooseGroup)}
            <Content className="container">
                {renderMusicGallery()}
                <Loading ref={loadingRef}/>
            </Content>
            {portInputVisible ? renderHttpPortInput() : null}

            <div className={"star_container"}>
                <div className={"shooting_star"}/>
            </div>

            <ColorPicker ref={colorPickerRef} onChangeColor={onColorPickerChange}/>
            <div className={"star_container"}>
                <Dropdown overlay={menu} placement="bottomCenter">
                    <img
                        className={"tiny_star"}
                        src={Images.ICON_SETTING}
                        width={"30rem"}
                        height={"30rem"}
                    />
                </Dropdown>

            </div>

        </FileDrop>
    );
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
    };
}

export default connect(select)(Home);
