import React, {useEffect, useRef, useState} from 'react';
import {MemoryRouter as Router, Route, Switch} from 'react-router-dom';
import './App.global.css';
import Home from './pages/Home/index'
import AudioPlayer from "./utils/AudioPlayer";
import Bus from "./utils/Event"
import * as Images from './public/Images'
import TypeWriterEffect from '../renderer/component/TypeWriter';
import {connect} from 'react-redux';
import {musicAction} from './actions/music';

const {ipcRenderer} = require('electron');

function App({dispatch}) {
    let r = useRef()

    let timer = null

    const [showMenu, setShowMenu] = useState(false)
    const [showCategory, setShowCategory] = useState(false)

    useEffect(() => {
        ipcRenderer.send('window-inited', {
            userAgent: navigator.userAgent,
        });

        // 添加切换专辑的监听器
        Bus.addListener("onChangeAudioList", (msg) => {
            r.current?.onChangeAudioList(msg)
        })

        return () => {
            // 生命周期结束时移除全部监听器
            Bus.removeAllListeners()
        }
    }, [])

    // 点击企划图片
    function onBabyClick() {
        setShowMenu(!showMenu)
        // 清除定时器
        timer && clearTimeout(timer)
        // 需要打开菜单时开启定时器
        if (!showMenu) {
            timer = setTimeout(() => {
                setShowCategory(true)
            }, 800)
        } else {
            setShowCategory(false)
        }
    }

    function chooseGroup(gp) {
        setShowMenu(false)
        setShowCategory(false)
        dispatch(musicAction.chooseGroup(gp))
    }

    function clickLogo() {
        Bus.emit("onTapLogo")
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
        showLyric: false,

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

    return (
        <div className={"outer_container"}>
            <div className="header">
                <img src={Images.ICON_HEAD} style={{paddingLeft: "20px"}} onClick={clickLogo}/>
                <TypeWriterEffect
                    textStyle={{
                        fontFamily: 'serif',
                        color: '#F87911',
                        fontWeight: 800,
                        fontSize: '2em',
                    }}
                    startDelay={2000}
                    cursorColor="#F87911"
                    multiText={[
                        'み ん な で 叶 え た 物 語',
                        'LoveLive! μ\'sic forever !!',
                        'LoveLive Music Player',
                    ]}
                    locale={'ja'}
                    hideCursorAfterText={true}
                    multiTextDelay={2000}
                    typeSpeed={100}
                />

                <div className={"header_baby"}>
                    <img className={"anima_tada"}
                         src={Images.ICON_MENU}
                         width={"60rem"}
                         height={"70rem"}
                         onClick={onBabyClick}
                    />
                </div>
            </div>
            <div style={{width: '100%', flexGrow: 1}}>
                <Router>
                    <Switch>
                        <Route path="/" component={Home}/>
                    </Switch>
                </Router>
            </div>
            <AudioPlayer {...options} ref={r}/>
            {showMenu ? <div className={"model"} onClick={onBabyClick}/> : null}
            {
                showMenu ?
                    <div className={["move_tile"].join(' ')}>
                        <img src={Images.ICON_TILE} height={'550px'}/>
                    </div> : null
            }
            {
                showCategory ?
                    <div className={"move_category"}>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_MIUSI} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("μ's")}/>
                            <span className={"menu_category_span"}>μ's</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_AQOURS} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("Aqours")}/>
                            <span className={"menu_category_span"}>Aqours</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_NIJI} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("Nijigasaki")}/>
                            <span className={"menu_category_span"}>虹咲学园偶像同好会</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_LIELLA} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("Liella!")}/>
                            <span className={"menu_category_span"}>Liella!</span>
                        </div>
                    </div> : null
            }
        </div>
    );
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup
    };
}

export default connect(select)(App);
