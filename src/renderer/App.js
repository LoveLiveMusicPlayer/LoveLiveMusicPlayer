import React, {useEffect, useRef, useState} from 'react';
import {Route, Routes, useLocation, useNavigate} from 'react-router-dom';
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
import {parse as parseLrc} from 'clrc';
import Transfer from "./pages/Transfer";
import {VersionUtils} from "./utils/VersionUtils";
import TransferMusic from "./pages/Transfer/TransferMusic";
import TransferData from "./pages/Transfer/TransferData";
import History from "./pages/History";

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

let currentLrcStatus = 'jp' // jp: 前后均日; zh: 前日后中; roma: 前日后罗马;

function App({dispatch, appVersion}) {
    // 播放器控件 引用
    let playerRef = useRef()
    // 歌词页 引用
    let musicDetailRef = useRef()

    let honokaTimer = null
    // 控制打开歌词页
    let isOpenMusicDialog = false
    // 控制更新切换歌曲
    let latestJPLyric = null
    // 上次显示歌词（上一句、本句、下一句）
    let prevLyric = {prevLrc: '', nextLrc: '', singleLrc: ''}
    // 切换的歌曲对应的每句的起始时间轴数组
    let timeList = []

    let navigate = useNavigate()
    let location = useLocation()

    // 音乐馆: -3; 我喜欢: -2; 最近播放: -1; 传输: 0 歌单: 1 ~ n
    const [chooseItem, setChooseItem] = useState(-3)
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
    // 同步当前歌词语言
    const [lrcLanguage, setLrcLanguage] = useState('jp')
    // 是否处于全屏模式
    const [fullScreen, setFullScreen] = useState(false)

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
        showMiniProcessBar: false,

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
        },

        responsive: false,
        toggleMode: false
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

    // 点击了左下角封面回调
    const onClickCoverCallback = (isOpen) => {
        setMusicDetailVisible(isOpen)
        if (isOpen) {
            setIsDialogOpen(true)
        } else {
            setTimeout(() => {
                setIsDialogOpen(false)
            }, 300)
        }
    }

    // 切换桌面歌词开关状态
    const onClickLyric = (status) => {
        ipcRenderer.send('toggle-desktop-lyric', status)
    }

    // 歌曲播放时间回调
    const onAudioTimeChange = (info) => {
        // 当前播放的索引（以日文歌词为基准）
        let jpIndex = 0
        // 前一句的起始时间轴
        let prevTime = 0
        // 本句的起始时间轴
        let currentTime = 0
        // 后一句的起始时间轴
        let nextTime = 0
        // 根据日文歌词解析出来的歌词列表
        let jpList = null





        if (info.jpLrc) {
            // 将日文字符串歌词转化为可被处理的歌词数组
            jpList = parseLrc(info.jpLrc)
            // 得到当前时间对应的前一句、本句、后一句对应的索引
            const triple = WorkUtils.threeLyricIndex(jpList.lyrics, info.currentTime)
            jpIndex = triple.current
            // 得到当前时间对应的前一句、本句、后一句对应的起始时间戳
            currentTime = AppUtils.isNull(jpList.lyrics[jpIndex]) ? 0 : jpList.lyrics[jpIndex].startMillisecond
            prevTime = AppUtils.isNull(jpList.lyrics[triple.prev]) ? 0 : jpList.lyrics[triple.prev].startMillisecond
            nextTime = AppUtils.isNull(jpList.lyrics[triple.next]) ? 0 : jpList.lyrics[triple.next].startMillisecond
            // 当日文歌词改变时，认为切换了歌曲（可能存在相同歌词，认为是同一首歌曲，但是问题不大）
            if (info.jpLrc !== latestJPLyric) {
                // 改变当前的日文歌词
                latestJPLyric = info.jpLrc
                // 清空数组
                timeList = []
                // 将每一句歌词的起始时间戳拼成数组对象
                jpList.lyrics.map(item => {
                    timeList.push(item.startMillisecond)
                })
            } else {
                // 歌词没有发生改变时，清空数组，让歌词页逻辑不再被触发
                timeList = []
            }
        }
        // 将各种各样的信息发送到歌词页中，等待进一步的逻辑判断
        musicDetailRef.current?.setMusicDetail(info, prevTime, currentTime, nextTime, timeList, researchCallback)

        // 获取桌面歌词要显示的歌词
        // 当为单行歌词时，要显示的是 singleLrc
        // 当为双行歌词时，要显示的分别是 prevLrc、nextLrc
        const {prevLrc, nextLrc, singleLrc} = WorkUtils.parseTickLrc(currentLrcStatus, info, jpList, jpIndex)

        // 过滤传递文本，优化总线传输
        if (prevLyric.prevLrc !== prevLrc || prevLyric.nextLrc !== nextLrc || prevLyric.singleLrc !== singleLrc) {
            prevLyric.prevLrc = prevLrc
            prevLyric.nextLrc = nextLrc
            prevLyric.singleLrc = singleLrc
            // 将歌词信息发送到桌面歌词窗口
            ipcRenderer.send('desktop-lrc-text', {prevLrc: prevLrc, nextLrc: nextLrc, singleLrc: singleLrc})
        }
    }

    const researchCallback = (_id) => {
        playerRef.current?.researchLyric(_id)
    }

    const renderBtnBack = () => {
        return initHomeKey === location.key ? null :
            <img className={'imgBack'} src={Images.ICON_BACK} onClick={() => navigate(-1)}/>
    }

    // 搭建路由逻辑
    const renderRouter = () => {
        if (showRouter) {
            return (
                <div className={'routerContainer'}>
                    <Routes>
                        <Route path="/album/:id" element={<Album/>}/>
                        <Route path="/menu/:id" element={<Menu/>}/>
                        <Route path="/love" element={<Love/>}/>
                        <Route path="/history" element={<History/>}/>
                        <Route path="/transfer" element={<Transfer/>}/>
                        <Route path="/transferMusic" element={<TransferMusic/>}/>
                        <Route path="/transferData" element={<TransferData/>}/>
                    </Routes>
                </div>
            )
        } else return null
    }

    // 左边栏内容选中
    const onMenuChange = (index) => {
        setChooseItem(index)
        switch (index) {
            case -3:
                setShowRouter(false)
                navigate('/home', {replace: true})
                break
            case -2:
                setShowRouter(true)
                navigate('/love', {replace: true})
                break
            case -1:
                setShowRouter(true)
                navigate('/history', {replace: true})
                break
            case 0:
                setShowRouter(true)
                navigate('/transfer', {replace: true})
                break
            default:
                setShowRouter(true)
                navigate(`/menu/${index}`, {replace: true})
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

    // 获取最新的数据版本，比较并提示
    const fetchLatestVersionHint = () => {
        WorkUtils.fetchLatestVersionHint().then(resp => {
            if (!AppUtils.isNull(resp)) {
                const array = []
                const currentDataVersion = Store.get('dataVersion') || 0
                resp.reverse().map(item => {
                    if (item.version > currentDataVersion && array.length < 3) {
                        array.push(item.message)
                    }
                })
                array.reverse().map(item => {
                    openNotification(item + "，请关注群文件更新目录")
                })
            }
        })
    }

    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                playerRef.current?.seek(-5)
            } else if (event.key === 'ArrowRight') {
                playerRef.current?.seek(5)
            }
        });
    }, [])

    useEffect(() => {
        const finish = () => {
            Bus.emit("onNotification", "应用准备强制恢复，即将重启")
            setTimeout(() => {
                ipcRenderer.invoke('restart')
            }, 2000)
        }
        // 判断本次版本是否是强制恢复版本
        ipcRenderer.on('getAppVersion', (event, version) => {
            const forceRemoveVersion = Store.get('forceRemoveVersion' + version)
            dispatch(appAction.appVersion(version))
            if (AppUtils.isNull(forceRemoveVersion) || version !== forceRemoveVersion) {
                if (VersionUtils.getIsNeedInit()) {
                    DBHelper.removeAllDB(version).then(finish)
                }
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

        ipcRenderer.on('main-lrc-language-change', (event, language) => {
            setLrcLanguage(language)
        })

        ipcRenderer.on('enter-full-screen', (event, args) => {
            setFullScreen(args)
        })
    }, [])

    useEffect(() => {
        document.getElementsByClassName('outer_container')[0].style.borderRadius = fullScreen ? 0 : '12px'
        playerRef.current?.setFull(fullScreen)
    }, [fullScreen])

    useEffect(() => {
        ipcRenderer.send('desktop-lrc-language-change', lrcLanguage)
        currentLrcStatus = lrcLanguage
    }, [lrcLanguage])

    useEffect(() => {
        setLrcLanguage(Store.get("lrcLanguage") || 'jp')

        setTimeout(() => {
            openNotification('这是一个开源项目，完全免费！')
        }, 1000)

        document.ondragstart = function () {
            return false;
        };

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

        // 延迟获取上次关闭播放器前的播放列表 + 获取最新的dataVersion数据，提示更新数据
        setTimeout(() => {
            getLatestPlayList()
            fetchLatestVersionHint()
        }, 2000)

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
        Bus.addListener("openMusicDetail", onClickCoverCallback)
        return () => removeEventListener("openMusicDetail", onClickCoverCallback)
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
                onClickLyric={status => onClickLyric(status)}
                onClickCover={_ => onClickCover(isOpenMusicDialog)}
                onAudioTimeChange={onAudioTimeChange}
                onClearAudioList={_ => {
                    document.getElementsByClassName('audio-lists-panel-header-close-btn')[0].click()
                    if (isOpenMusicDialog) {
                        onClickCover(isOpenMusicDialog)
                    }
                }}
            />

            {showMenu ?
                <div
                    className={"model"}
                    style={{borderRadius: fullScreen ? 0 : 12}}
                    onClick={onBabyClick}/> : null
            }

            <GroupModal
                showMenu={showMenu}
                showCategory={showCategory}
                chooseGroup={chooseGroup}
            />

            <MusicDetail
                ref={musicDetailRef}
                musicDetailVisible={musicDetailVisible}
                isDialogOpen={isDialogOpen}
                lrcLanguage={lrcLanguage}
                isFullScreen={fullScreen}
                lrcLanguageCallback={language => setLrcLanguage(language)}
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
