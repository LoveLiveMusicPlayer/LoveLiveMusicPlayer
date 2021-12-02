import React, {useEffect, useRef, useState} from 'react';
import {Route, Switch, useHistory, useLocation} from 'react-router-dom';
import './App.global.css';
import Home from './pages/Home'
import Album from './pages/Album'
import Love from './pages/Love'
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
import Menu from "./pages/Menu";
import {WorkUtils} from "./utils/WorkUtils";
import {WindowButton} from "./component/WindowButton";
import {appAction} from "./actions/app";

const {ipcRenderer} = require('electron')
const os = require("os").platform();

// 全局通知弹窗
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

    // 音乐馆: -2; 我喜欢: -1; 最近播放: 0; 歌单: 1 ~ n
    const [chooseItem, setChooseItem] = useState(-2)
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
    // 触摸Header显示功能按键
    const [onShowFunc, setShowFunc] = useState(false)

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

    // 点击了团组 item
    const chooseGroup = (gp) => {
        setShowMenu(false)
        setShowCategory(false)
        dispatch(musicAction.chooseGroup(gp))
    }

    // 播放器参数配置
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
        defaultPlayMode: Store.get('playMode') || 'orderLoop',

        // 窗口显示模式 (mini | full)
        mode: 'full',

        // mini模式显示圆形进度条
        showMiniProcessBar: true,

        // 加载失败是否跳到下一首
        loadAudioErrorPlayNext: false,

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
        showLyric: false,

        // 默认播放音量 (default 1 range '0-1')
        defaultVolume: Store.get('volume') || 1,

        // 图片不可用时自动隐藏封面
        autoHiddenCover: false,

        // 通过空格键控制音乐的播放与暂停
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

    // 点击了左下角封面
    const onClickCover = (isWillClose) => {
        Bus.emit("openMusicDetail", !isWillClose)
        playerRef.current?.onShowDetail(!isWillClose)
        options.theme = isWillClose ? "light" : "dark"
        const title = document.body.getElementsByClassName('audio-lists-panel-header-title')
        playerRef.current?.updateParams({theme: options.theme})
        const spans = [...title[0].getElementsByTagName('span')]
        spans.map(item => {
            item.style.color = isWillClose ? '#000000' : '#ffffff'
        })
        isOpenMusicDialog = !isWillClose
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

    // 歌曲播放时间回调
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
                        <Route path="/menu" exact component={Menu}/>
                        <Route path="/love" exact component={Love}/>
                    </Switch>
                </div>
            )
        } else return null
    }

    // 左边栏内容选中
    const onMenuChange = (index) => {
        setChooseItem(index)
        switch (index) {
            case -2:
                setShowRouter(false)
                history.push('/home')
                break
            case -1:
                setShowRouter(true)
                history.push('/love')
                break
            case 0:

                break
            default:
                setShowRouter(true)
                history.push('/menu', {id: index})
                break
        }
    }

    // 播放上次记住的播放列表
    const getLatestPlayList = () => {
        const playList = Store.get("playList")
        const playId = Store.get("playId")
        if (playList && playList.length > 0 && !AppUtils.isEmpty(playId)) {
            let playIndex = 0
            playList.map((item, index) => {
                item.cover = Store.get('url') + 'LoveLive' + item.cover.split('/LoveLive')[1]
                item.musicSrc = Store.get('url') + 'LoveLive' + item.musicSrc.split('/LoveLive')[1]
                if (item._id === playId) {
                    playIndex = index
                }
            })
            playList[0].playIndex = playIndex
            playerRef.current?.onChangeAudioList(playList, true)
        }
    }

    useEffect(() => {
        // 判断本次版本是否是强制恢复版本
        ipcRenderer.on('getAppVersion', (event, version) => {
            const initedVersion = Store.get('appInitedVersion')
            dispatch(appAction.appVersion(version))
            if (AppUtils.isNull(initedVersion) || version !== initedVersion) {
                WorkUtils.requestNeedInit(version).then(needInit => {
                    if (needInit) {
                        DBHelper.removeAllDB().then(_ => {
                            Store.set('appInitedVersion', version)
                            Bus.emit("onNotification", "应用准备强制恢复，即将重启")
                            setTimeout(() => {
                                ipcRenderer.invoke('restart')
                            }, 2000)
                        })
                    }
                }).catch(_ => {
                })
            }
        })
        ipcRenderer.send('getAppVersion')

        ipcRenderer.on('playMusic', _ => {
            playerRef.current?.onTogglePlay()
        })

        ipcRenderer.on('prevMusic', _ => {
            playerRef.current?.onPrevPlay()
        })

        ipcRenderer.on('nextMusic', _ => {
            playerRef.current?.onNextPlay()
        })
    }, [])

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

        Bus.addListener("onNotification", msg => openNotification(msg))

        // 添加切换专辑的监听器
        Bus.addListener("onChangeAudioList", msg => {
            playerRef.current?.onChangeAudioList(msg)
        })

        // 修改主题
        Bus.addListener("onBodyChangeColor", colors => {
            DBHelper.setBGColor(JSON.stringify(colors))
            AppUtils.setBodyColor(colors)
        })

        // 延迟获取上次关闭播放器前的播放列表
        setTimeout(() => getLatestPlayList(), 2000)

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
        <div className={"outer_container"} onClick={() => Bus.emit('onClickBody')}>
            <div className="header">
                <div style={{position: 'relative'}}
                     onMouseOver={() => setShowFunc(true)}
                     onMouseOut={() => setShowFunc(false)}
                >
                    <div className={'logo'}>
                        <img src={Images.ICON_HEAD}/>
                    </div>
                    <div className={'headerFunc'}
                         style={{visibility: onShowFunc && os !== 'darwin' ? 'visible' : 'hidden'}}
                    >
                        <WindowButton type={'close'}/>
                        <WindowButton type={'min'}/>
                        <WindowButton type={'max'}/>
                    </div>
                </div>
                {/*{renderBtnBack()}*/}
                <MyTypeWriter/>
                <Honoka onBabyClick={onBabyClick}/>
            </div>

            <div className={'middleContainer'}>
                <SongMenu chooseItem={chooseItem} onChooseItem={onMenuChange}/>
                <Home showAlbum={() => setShowRouter(true)} isRoot={!showRouter}/>
                {renderRouter()}
            </div>

            <AudioPlayer
                {...options}
                ref={playerRef}
                onClickCover={_ => onClickCover(isOpenMusicDialog)}
                onAudioTimeChange={onAudioTimeChange}
                onClearAudioList={_ => {
                    document.getElementsByClassName('audio-lists-panel-header-close-btn')[0].click()
                    if (isOpenMusicDialog) {
                        onClickCover(isOpenMusicDialog)
                    }
                }}
            />

            {showMenu ? <div className={"model"} onClick={onBabyClick}/> : null}

            <GroupModal
                showMenu={showMenu}
                showCategory={showCategory}
                chooseGroup={chooseGroup}
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
        chooseGroup: store.music.chooseGroup,
        appVersion: store.app.appVersion
    };
}

export default connect(select)(App);
