import React, {useEffect, useRef, useState} from 'react';
import Store from "../../utils/Store"
import './index.css'
import "animate.css"
import {Layout} from 'antd';
import {AppUtils} from "../../utils/AppUtils";
import fs from "fs";
import FileDrop from '../../component/DragAndDrop'
import {AlbumHelper} from "../../dao/AlbumHelper";
import {musicAction} from "../../actions/music";
import {MusicHelper} from "../../dao/MusicHelper";
import Bus from "../../utils/Event"
import {Loading} from "../../component/Loading";
import {DBHelper} from "../../dao/DBHelper";
import Modal from "react-modal";
import * as Images from "../../public/Images";
import {ColorPicker} from "../../component/ColorPicker";
import {WorkUtils} from "../../utils/WorkUtils";
import {MusicDetail} from "../../component/MusicDetail";
import {useHistory} from "react-router-dom";
import {TinyStar} from "../../component/TinyStar";
import {MusicGallery} from "../../component/MusicGallery";
import {PortDialog} from "../../component/PortDialog";

const {ipcRenderer} = require("electron")
const {connect} = require('react-redux')
const {Content} = Layout;

const Home = ({dispatch, chooseGroup}) => {
    let history = useHistory()

    // 专辑列表引用
    let musicGalleryRef = useRef()
    // Loading 窗口引用
    let loadingRef = useRef()
    // 选择主题色引用
    let colorPickerRef = useRef()
    let musicDetailRef = useRef()

    // 屏幕宽度
    const [width, setWidth] = useState(window.innerWidth)
    // 专辑列表
    const [albumList, setAlbumList] = useState({})
    // 当前选中的企划
    const [group, setGroup] = useState(chooseGroup)
    // 导入专辑json时对列表进行刷新
    const [refresh, setRefresh] = useState()
    // HTTP服务的 IP + 端口 地址
    const [URL, setURL] = useState("http://localhost:10000/")
    // 显示HTTP端口输入框
    const [portInputVisible, setPortInputVisible] = useState(false)
    // HTTP服务的端口号
    const [port, setPort] = useState(10000)
    // HTTP服务要加载的目录
    const [rootDir, setRootDir] = useState()

    // 显示歌曲详情界面 + 动效
    const [musicDetailVisible, setMusicDetailVisible] = useState(false)
    // 显示歌曲详情承载弹窗 + 延时销毁
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const [blueCover, setBlurCover] = useState()

    // 监听窗口改变大小
    const listener = function () {
        let width = window.innerWidth - 250
        const height = window.innerHeight
        const radio = 1275 / 648
        // 防止在横向变宽时，图片变大
        if (width / height > radio) {
            width = height * radio
        }
        setWidth(width)
    }

    const onTapLogoListener = function () {
        setPortInputVisible(true)
    }

    const onAudioTimeChange = function (info) {
        setBlurCover(info.cover)
        musicDetailRef.current?.setMusicDetail(info)
    }

    useEffect(() => {
        listener()

        // 如果之前有保存http服务地址，直接载入
        const httpServer = DBHelper.getHttpServer()
        if (httpServer) {
            setHttpServer(httpServer)
        }

        // 设置http服务回调
        ipcRenderer.on("openHttpReply", (event, path, port) => {
            DBHelper.setHttpServer({path: path, port: port})
            setRootDir(path)
            setPort(port)
            setURL(`http://localhost:${port}/`)
            setRefresh(new Date().getTime())
        })

        // 添加窗口大小变化监听器
        window.addEventListener("resize", listener)

        // 添加触摸Logo监听器
        Bus.addListener("onTapLogo", onTapLogoListener)
        Bus.addListener("onAudioTimeChange", onAudioTimeChange)

        return () => {
            // 生命周期结束后将监听器移除
            window.removeEventListener("resize", listener)
            removeEventListener("onTapLogo", onTapLogoListener)
            removeEventListener("onAudioTimeChange", onAudioTimeChange)
        }
    }, [])

    useEffect(() => {
        const onClickCover = function (isOpen) {
            setMusicDetailVisible(isOpen)
            if (isOpen) {
                setIsDialogOpen(true)
            } else {
                setTimeout(() => {
                    setIsDialogOpen(false)
                }, 300)
            }
        }

        // 添加点击左下角封面监听器
        Bus.addListener("openMusicDetail", onClickCover)

        return () => {
            removeEventListener("openMusicDetail", onClickCover)
        }
    }, [musicDetailVisible])

    /**
     * 企划变更或者导入专辑列表刷新触发
     */
    useEffect(() => {
        musicGalleryRef.current?.toFirst()

        // 切换企划时从数据库加载对应的全部专辑
        WorkUtils.changeAlbumByGroup(group, URL).then(res => {
            musicGalleryRef.current?.showRightButton((res.top.length + res.bottom.length) > 10)
            setAlbumList(res)
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

    // 播放选中专辑
    const playOne = (id) => {
        // history.push('/album', {id: 1})
        WorkUtils.findOneAlbumById(id, URL)
    }

    // 播放团内全部专辑
    const playAll = () => {
        WorkUtils.playAlbumsByGroup(group, URL)
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
        loadingRef.current?.show("导入专辑中..")
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

    // 当选择了企划时将触发redux保存并获取企划数据
    const refreshAlbum = (gp) => {
        if (gp !== null && gp !== group) {
            setGroup(gp)
            dispatch(musicAction.chooseGroup(gp))
        }
        return null
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

    // 渲染歌曲详情界面
    const renderMusicDetail = () => {
        const showCover = blueCover && blueCover.indexOf("LoveLive") > 0
        let cover = Images.MENU_LIELLA
        if (showCover) {
            cover = URL + "LoveLive" + blueCover.split('/LoveLive')[1]
        }
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
                <MusicDetail ref={musicDetailRef} cover={cover}/>
            </Modal>
        )
    }

    const onColorPickerChange = (color1, color2) => {
        Bus.emit("onBodyChangeColor", {color1: color1, color2: color2})
    }

    return (
        <FileDrop
            onUpload={onUpload}
            count={1}
            formats={['']}
        >
            {refreshAlbum(chooseGroup)}

            <Content className="container">
                <MusicGallery
                    ref={musicGalleryRef}
                    albumList={albumList}
                    width={width}
                    playOne={playOne}
                />
                <Loading ref={loadingRef}/>
            </Content>

            {renderMusicDetail()}

            <TinyStar
                playAll={playAll}
                changeColor={() => {
                    colorPickerRef.current?.open(DBHelper.getBGColor())
                }}
                checkUpdate={() => ipcRenderer.invoke('checkUpdate')}
                refreshData={refreshData}
            />

            <ColorPicker ref={colorPickerRef} onChangeColor={onColorPickerChange}/>

            <PortDialog
                isShow={portInputVisible}
                rootDir={rootDir}
                port={port}
                close={() => setPortInputVisible(false)}
                setHttpServer={() => setHttpServer({path: rootDir, port: port})}
                setPort={setPort}
            />
        </FileDrop>
    );
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
    };
}

export default connect(select)(Home);
