import React, {useEffect, useRef, useState} from 'react';
import './index.css'
import "animate.css"
import {Layout} from 'antd';
import {AppUtils} from "../../utils/AppUtils";
import fs from "fs";
import FileDrop from '../../component/DragAndDrop'
import {musicAction} from "../../actions/music";
import Bus from "../../utils/Event"
import {Loading} from "../../component/Loading";
import {DBHelper} from "../../dao/DBHelper";
import {ColorPicker} from "../../component/ColorPicker";
import {WorkUtils} from "../../utils/WorkUtils";
import {useHistory} from "react-router-dom";
import {TinyStar} from "../../component/TinyStar";
import {MusicGallery} from "../../component/MusicGallery";
import {PortDialog} from "../../component/PortDialog";
import Store from '../../utils/Store'
import * as Images from '../../public/Images'
import {CustomDialog} from "../../component/CustomDialog";

const {ipcRenderer} = require("electron")
const {connect} = require('react-redux')
const {Content} = Layout;

const Home = ({dispatch, chooseGroup, showAlbum, isRoot}) => {
    let history = useHistory()

    // 专辑列表引用
    let musicGalleryRef = useRef()
    // Loading 窗口引用
    let loadingRef = useRef()
    // 选择主题色引用
    let colorPickerRef = useRef()
    let clearDialog = useRef()

    // 屏幕宽度
    const [width, setWidth] = useState(window.innerWidth)
    // 专辑列表
    const [albumList, setAlbumList] = useState({})
    // 当前选中的企划
    const [group, setGroup] = useState(chooseGroup)
    // 导入专辑json时对列表进行刷新
    const [refresh, setRefresh] = useState()
    // 显示HTTP端口输入框
    const [portInputVisible, setPortInputVisible] = useState(false)
    // HTTP服务的端口号
    const [port, setPort] = useState(10000)
    // HTTP服务要加载的目录
    const [rootDir, setRootDir] = useState()

    const [clearDialogVisible, setClearDialogVisible] = useState(false)

    const [btnPlay, setBtnPlay] = useState(Images.ICON_PLAY_UNSELECT)

    // 监听窗口改变大小
    const listener = function () {
        let width = window.innerWidth - 250
        const height = window.innerHeight
        const radio = 1250 / 648
        // 防止在横向变宽时，图片变大
        if (width / height > radio) {
            width = height * radio
        }
        setWidth(width)
    }

    const onTapLogoListener = function () {
        setPortInputVisible(true)
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
            Store.set('url', `http://localhost:${port}/`)
            setRefresh(new Date().getTime())
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
        musicGalleryRef.current?.toFirst()

        // 切换企划时从数据库加载对应的全部专辑
        WorkUtils.changeAlbumByGroup(group).then(res => {
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

    // 显示专辑详情
    const showAlbumInfo = (id) => {
        showAlbum()
        history.push('/album', {id: id})
    }

    // 播放团内全部专辑
    const playGroup = () => {
        WorkUtils.playAlbumsByGroup(group)
    }

    // 播放全部歌曲
    const playAll = () => {
        WorkUtils.playAllAlbums()
    }

    // 播放专辑全部歌曲
    const playAllByAlbum = (album) => {
        WorkUtils.playAlbumByUniqueId(album.id)
    }

    // 更新数据
    const refreshData = () => {
        WorkUtils.updateJsonData(
            () => loadingRef.current?.show("导入专辑中.."),
            (progress) => loadingRef.current?.setProgress(progress),
            () => loadingRef.current?.setTitle("导入歌曲中.."),
            () => setRefresh(new Date().getTime())
        ).then(_ => {
            setTimeout(() => {
                loadingRef.current?.hide()
            }, 1000)
        })
    }

    const onDelUserData = (isDel) => {
        if (isDel) {
            DBHelper.removeUserDB()
            clearDialog.current?.forceClose()
            restart()
        }
    }

    const deleteAllData = () => {
        DBHelper.removeAllDB().then(_ => {
            clearDialog.current?.forceClose()
            restart()
        })
    }

    const deleteDIYData = () => {
        DBHelper.removeDIYDB().then(_ => {
            clearDialog.current?.forceClose()
            restart()
        })
    }

    const restart = () => {
        Bus.emit("onNotification", "应用即将重启")
        setTimeout(() => {
            ipcRenderer.invoke('restart')
        }, 1000)
    }

    const renderClearDialogBottom = () => {
        return (
            <div className={'clearDialog'}>
                <text>用户数据：主题背景、播放器配置</text>
                <text>自建数据：用户数据、我喜欢、歌单</text>
                <text>全部数据：自建数据、云端缓存数据</text>
            </div>
        )
    }

    // 当选择了企划时将触发redux保存并获取企划数据
    const refreshAlbum = (gp) => {
        if (gp !== null && gp !== group) {
            setGroup(gp)
            dispatch(musicAction.chooseGroup(gp))
        }
        return null
    }

    const onColorPickerChange = (color1, color2) => {
        Bus.emit("onBodyChangeColor", {color1: color1, color2: color2})
    }

    return (
        <div className={'homeContainer'} style={{visibility: isRoot ? 'visible' : 'hidden'}}>
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
                        showAlbumInfo={showAlbumInfo}
                        playAll={playAllByAlbum}
                    />
                    <Loading ref={loadingRef}/>
                </Content>

                <TinyStar
                    playAll={playAll}
                    changeColor={() => colorPickerRef.current?.open(DBHelper.getBGColor())}
                    checkUpdate={() => ipcRenderer.invoke('checkUpdate')}
                    refreshData={refreshData}
                    deleteData={() => setClearDialogVisible(true)}
                />

                <img
                    className={'btnPlay'}
                    src={btnPlay}
                    onClick={playGroup}
                    onMouseOver={() => setBtnPlay(Images.ICON_PLAY_SELECT)}
                    onMouseOut={() => setBtnPlay(Images.ICON_PLAY_UNSELECT)}
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

                <CustomDialog
                    ref={clearDialog}
                    isShow={clearDialogVisible}
                    close={() => setClearDialogVisible(false)}
                    hint={'请选择要清理的数据'}
                    confirmText={'删除用户数据'}
                    result={onDelUserData}
                    thirdButton={{text: '删除全部数据', callback: () => deleteAllData()}}
                    fourthButton={{text: '删除自建数据', callback: () => deleteDIYData()}}
                    bottomContainer={renderClearDialogBottom}
                />
            </FileDrop>
        </div>
    );
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
    };
}

export default connect(select)(Home);
