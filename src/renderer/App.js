import React, {useEffect, useRef, useState} from 'react';
import {Route, Switch, useHistory, useLocation} from 'react-router-dom';
import './App.global.css';
import Home from './pages/Home'
import Album from './pages/Album'
import AudioPlayer from "./utils/AudioPlayer";
import Bus from "./utils/Event"
import * as Images from './public/Images'
import {connect} from 'react-redux';
import {musicAction} from './actions/music';
import {notification} from "antd";
import {SmileOutlined} from '@ant-design/icons';
import {DBHelper} from "./dao/DBHelper";
import {MyTypeWriter} from "./component/TypeWriter/MyTypeWriter";
import {GroupModal} from "./component/GroupModal";
import {Honoka} from "./component/Honoka";
import {AppUtils} from "./utils/AppUtils";
import {SongMenu} from "./component/SongMenu";
import {MusicDetail} from "./component/MusicDetail";
import Store from '../../src/renderer/utils/Store'

const {ipcRenderer} = require('electron');

const openNotification = (message) => {
    notification.info({
        message: '请注意',
        description: message,
        placement: "topRight",
        icon: <SmileOutlined style={{color: '#108ee9'}}/>,
        className: 'custom-class',
        style: {marginTop: 60},
    });
};

function App({dispatch}) {
    let playerRef = useRef()
    let musicDetailRef = useRef()

    let honokaTimer = null
    let isOpenMusicDialog = false
    let history = useHistory()
    let location = useLocation()
    // 显示团组的 modal
    const [showMenu, setShowMenu] = useState(false)
    // 显示团组的图片
    const [showCategory, setShowCategory] = useState(false)

    // 显示歌曲详情界面 + 动效
    const [musicDetailVisible, setMusicDetailVisible] = useState(false)
    // 显示歌曲详情承载弹窗 + 延时销毁
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    // 根路由的key
    const [initHomeKey, setInitHomeKey] = useState("")
    // 是否显示路由容器
    const [showRouter, setShowRouter] = useState(false)

    // 点击企划图片
    const onBabyClick = () => {
        setShowMenu(!showMenu)
        // 清除定时器
        honokaTimer && clearTimeout(honokaTimer)
        // 需要打开菜单时开启定时器
        if (!showMenu) {
            honokaTimer = setTimeout(() => {
                setShowCategory(true)
            }, 800)
        } else {
            setShowCategory(false)
        }
    }

    const chooseGroup = (gp) => {
        setShowMenu(false)
        setShowCategory(false)
        dispatch(musicAction.chooseGroup(gp))
    }

    const options = {
        // 播放列表
        audioLists: [],

        // 当前播放的索引
        playIndex: 0,

        // 主题色('light' | 'dark' | 'auto', default = 'dark')
        theme: 'light',

        // mini 窗口移动范围(body,left,top,right,bottom)
        bounds: 'body',

        // 替换列表时是否将当前播放列表清空
        clearPriorAudioLists: false,

        // 加载播放列表后是否自动播放
        autoPlayInitLoadPlayList: false,

        // 页面加载后是否立即加载音频
        preload: false,

        // 毛玻璃效果
        glassBg: true,

        // 下次进入是否保存播放状态
        remember: false,

        // 音乐是否可被删除
        remove: true,

        // mini 窗口默认显示位置
        defaultPosition: {
            right: 50,
            bottom: 60,
        },

        // 播放模式 (order 顺序播放 | orderLoop 菜单循环 | singleLoop 单曲循环 | shufflePlay 随机播放, default = 'order')
        defaultPlayMode: 'order',

        // 窗口显示模式 (mini | full)
        mode: 'full',

        // 加载音频后是否自动播放
        autoPlay: true,

        // 允许 mini 窗口拖动 (default = true)
        drag: false,

        // 允许拖动进度条 (default = true)
        seeked: true,

        // 显示 Chrome 媒体会话 (default = false)
        showMediaSession: true,

        // 显示刷新按钮
        showReload: false,

        // 显示下载按钮
        showDownload: false,

        // 显示播放模式按钮
        showPlayMode: true,

        // 显示主题切换按钮
        showThemeSwitch: false,

        // 显示歌词按钮
        showLyric: true,

        // 默认播放音量 (default 1 range '0-1')
        defaultVolume: 1,

        // 图片不可用时自动隐藏封面
        autoHiddenCover: false,

        // 遇到音频空白帧自动播放和暂停
        spaceBar: true,

        // 时区 (en_US, zh_CN, default = 'en_US')
        locale: 'zh_CN',

        // 移动端媒体查询 default '(max-width: 768px) and (orientation : portrait)'
        mobileMediaQuery: '(max-width: 1024px)',

        // 音频渐入渐出
        volumeFade: {
            fadeIn: 1000,
            fadeOut: 1000,
        }
    }

    const onClickCover = () => {
        Bus.emit("openMusicDetail", !isOpenMusicDialog)
        options.theme = isOpenMusicDialog ? "light" : "dark"
        playerRef.current?.updateParams({theme: options.theme})
        isOpenMusicDialog = !isOpenMusicDialog
    }

    const onClickCover2 = (isOpen) => {
        setMusicDetailVisible(isOpen)
        if (isOpen) {
            setIsDialogOpen(true)
        } else {
            setTimeout(() => {
                setIsDialogOpen(false)
            }, 300)
        }
    }

    const onAudioTimeChange = (info) => {
        musicDetailRef.current?.setMusicDetail(info)
    }

    const renderBtnBack = () => {
        return initHomeKey === location.key ? null :
            <img className={'imgBack'} src={Images.ICON_BACK} onClick={() => history.goBack()}/>
    }

    const renderRouter = () => {
        if (showRouter) {
            return (
                <div className={'routerContainer'}>
                    <Switch>
                        <Route path="/album" exact component={Album}/>
                    </Switch>
                </div>
            )
        } else return null
    }

    useEffect(() => {
        setTimeout(() => {
            openNotification('这是一个开源项目，完全免费！')
        }, 1000)

        // 设置背景色
        AppUtils.setBodyColor(DBHelper.getBGColor())

        // 当指定端口不存在时，设置默认值
        if (AppUtils.isEmpty(Store.get("url"))) {
            Store.set("url", "http://localhost:10000/")
        }

        // 添加切换专辑的监听器
        Bus.addListener("onChangeAudioList", (msg) => {
            playerRef.current?.onChangeAudioList(msg)
        })

        // 修改主题
        Bus.addListener("onBodyChangeColor", (colors) => {
            DBHelper.setBGColor(JSON.stringify(colors))
            AppUtils.setBodyColor(colors)
        })

        return () => Bus.removeAllListeners()
    }, [])

    useEffect(() => {
        if (initHomeKey === '' && initHomeKey !== location.key) {
            // 设置初始化路由 key
            setInitHomeKey(location.key)
        }
        if ((initHomeKey === location.key) && showRouter) {
            // 当前路由为根路由时隐藏路由容器
            setShowRouter(false)
        }
    }, [location.key])

    useEffect(() => {
        // 实现点击封面收回时延迟动效的监听器
        Bus.addListener("openMusicDetail", onClickCover2)
        return () => removeEventListener("openMusicDetail", onClickCover2)
    }, [musicDetailVisible])

    return (
        <div className={"outer_container"}>
            <div className="header">
                <div className={'logo'}>
                    <img src={Images.ICON_HEAD}/>
                </div>
                {renderBtnBack()}
                <MyTypeWriter/>
                <Honoka onBabyClick={onBabyClick}/>
            </div>

            <div className={'middleContainer'}>
                <SongMenu/>
                <Home showAlbum={() => setShowRouter(true)} isRoot={!showRouter}/>
                {renderRouter()}
            </div>

            <AudioPlayer
                {...options}
                ref={playerRef}
                onClickCover={_ => onClickCover()}
                onAudioTimeChange={onAudioTimeChange}
            />

            {showMenu ? <div className={"model"} onClick={onBabyClick}/> : null}

            <GroupModal
                showMenu={showMenu}
                showCategory={showCategory}
                chooseGroup={item => chooseGroup(item)}
            />

            <MusicDetail
                ref={musicDetailRef}
                musicDetailVisible={musicDetailVisible}
                isDialogOpen={isDialogOpen}
            />
        </div>
    );
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup
    };
}

export default connect(select)(App);
