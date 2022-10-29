import React from 'react'
import ReactJkMusicPlayer from '../component/MusicPlayer'
import 'react-jinke-music-player/assets/index.css'
import Store from '../utils/Store'
import * as Images from '../public/Images'
import {Dropdown, Menu} from 'antd';
import {MusicHelper} from "../dao/MusicHelper";
import {AppUtils} from "./AppUtils";
import Bus from '../utils/Event'
import {LoveHelper} from "../dao/LoveHelper";
import {SelectDialog} from "../component/SelectDialog";
import {SongMenuHelper} from "../dao/SongMenuHelper";
import {musicAction} from "../actions/music";
import {AlbumHelper} from "../dao/AlbumHelper";
import {WorkUtils} from "./WorkUtils";
import {OSS_URL_HEAD} from "./URLHelper";

const {ipcRenderer} = require('electron')
const {connect} = require('react-redux')

let currentMusicUniqueId = ""
let currentPlayList = []
const lrc = {jpLrc: null, zhLrc: null, romaLrc: null}
let currentMusicName = null

class AudioPlayer extends React.PureComponent {

    constructor(props) {
        super(props);
        this.audioInstance = null
        this.state = {
            params: {
                ...props
            },
            playIndex: 0,
            audioList: [],
            isShowDetail: false,
            onHover: false,
            addListDisplay: false,
            menu: [],
            lyricShow: false
        }
        this.r = null
    }

    componentWillMount() {
        ipcRenderer.on("toggle-desktop-lyric-reply", () => {
            this.setState({lyricShow: !this.state.lyricShow})
        })
    }

    // 添加一个音频
    onAddAudio = (song) => {
        let hasSong = false
        this.r.props.audioLists.map(audio => {
            if (audio.name === song.name) {
                hasSong = true
            }
        })
        if (!hasSong) {
            this.updateParams({
                clearPriorAudioLists: true,
                quietUpdate: true,
                audioLists: [...this.state.params.audioLists, song],
                playIndex: this.state.playIndex
            })
        }
    }

    // 切换专辑
    onChangeAudioList = (arr, init) => {
        const index = arr && arr.length > 0 && arr[0].playIndex ? arr[0].playIndex : 0
        this.setState({playIndex: index})
        this.updateParams({
            clearPriorAudioLists: true,
            audioLists: arr,
            playIndex: index
        })
        if (init && init === true) {
            setTimeout(() => {
                this.audioInstance?.pause()
            }, 500)
        }
    }

    // 是否处于显示歌词页面中
    onShowDetail = (isShow) => {
        this.setState({isShowDetail: isShow})
    }

    // 更新播放器参数
    updateParams = (params) => {
        const data = {
            ...this.state.params,
            ...params,
        }
        data.playMode = Store.get('playMode') || 'orderLoop'
        data.defaultVolume = Store.get('volume') || 1
        this.setState({
            params: data,
        })
    }

    // 切换播放/暂停
    onTogglePlay = () => {
        this.audioInstance?.togglePlay()
    }

    // 上一首
    onPrevPlay = () => {
        if (currentPlayList.length > 1) {
            this.audioInstance?.playPrev()
        } else this.audioInstance?.load()
    }

    // 下一首
    onNextPlay = () => {
        if (currentPlayList.length > 1) {
            this.audioInstance?.playNext()
        } else this.audioInstance?.load()
    }

    // 设置播放器是否全屏
    setFull = (isFullScreen) => {
        this.audioInstance.setFullScreen(isFullScreen)
    }

    content = () => {
        return (
            <Menu style={{marginBottom: 25}}>
                <Menu.Item key={"addTo"}>
                    <a onClick={async () => {
                        if (!AppUtils.isEmpty(currentMusicUniqueId)) {
                            SongMenuHelper.findPcMenu().then(menu => {
                                if (menu.length > 0) {
                                    this.setState({
                                        addListDisplay: true,
                                        menu: menu
                                    })
                                } else {
                                    Bus.emit('onNotification', '请先新增歌单')
                                }
                            })
                        } else {
                            Bus.emit('onNotification', '歌曲未载入')
                        }
                    }}>添加到</a>
                </Menu.Item>
                <Menu.Divider/>
                <Menu.Item key={"iLove"}>
                    <a onClick={async () => {
                        if (!AppUtils.isEmpty(currentMusicUniqueId)) {
                            const music = await MusicHelper.findOneMusicByUniqueId(currentMusicUniqueId)
                            LoveHelper.insertSongToLove(music).then(_ => {
                                Bus.emit('onNotification', '已添加到我喜欢')
                            })
                        } else {
                            Bus.emit('onNotification', '歌曲未载入')
                        }
                    }}>我喜欢</a>
                </Menu.Item>
            </Menu>
        )
    }

    renderDIYButton = () => {
        return (
            <>
                <Dropdown overlay={this.content()} placement="bottomCenter">
                    <img
                        src={Images.ICON_MORE}
                        width={25}
                        height={25}
                        style={{opacity: this.state.onHover ? 0.9 : 1}}
                        onMouseOver={() => this.setState({onHover: true})}
                        onMouseOut={() => this.setState({onHover: false})}
                    />
                </Dropdown>
                <div style={{width: 15}}/>
                <img
                    src={this.state.lyricShow ? Images.ICON_LRC_OPEN : Images.ICON_LRC_CLOSE}
                    width={25}
                    height={25}
                    onClick={() => {
                        this.r.props.onClickLyric(!this.state.lyricShow)
                    }}
                />
            </>
        )
    }

    // 添加一首歌到指定歌单
    addListToMenu = async (id) => {
        if (!AppUtils.isEmpty(currentMusicUniqueId)) {
            const music = await MusicHelper.findOneMusicByUniqueId(currentMusicUniqueId)
            SongMenuHelper.insertSongToMenu(id, music).then(_ => {
                Bus.emit('onNotification', '已添加到歌单')
            })
        } else {
            Bus.emit('onNotification', '歌曲未载入')
        }
    }

    // 使得对应播放模式切换到正确的歌曲（修复播放器三方库的bug）
    handleNextPlay = (audioLists, audioInfo, playMode) => {
        let orderLoopCount = 0
        audioLists.map((item, index) => {
            if (item._id === audioInfo._id) {
                orderLoopCount = index
            }
        })
        if (orderLoopCount !== audioLists.length - 1) {
            this.audioInstance?.playNext()
        } else if (playMode === 'orderLoop') {
            this.audioInstance?.playByIndex(1)
        }
    }

    // 网络获取歌词
    requestLrc = async (url) => {
        try {
            if (url) {
                const encodeUrl = OSS_URL_HEAD + encodeURIComponent(url.replace(OSS_URL_HEAD, ""))
                const resp = await WorkUtils.requestLyric(encodeUrl)
                if (!AppUtils.isEmpty(resp)) {
                    return resp.split('\n').map(item => {
                        return item.trim()
                    }).join('\n')
                }
            }
        } catch (e) {}
        return null
    }

    render() {
        const {params, playIndex} = this.state
        params.playIndex = playIndex
        return (
            <div style={{position: 'relative'}}>
                <ReactJkMusicPlayer
                    getAudioInstance={(instance) => (this.audioInstance = instance)}
                    ref={(ref) => this.r = ref}
                    style={{marginTop: '100px'}}
                    {...params}
                    onModeChange={(mode) => {
                        this.updateParams({mode})
                    }}
                    onPlayModeChange={(playMode) => {
                        Store.set('playMode', playMode)
                        this.updateParams({playMode})
                    }}
                    onPlayIndexChange={(playIndex) => {
                        this.setState({playIndex: playIndex})
                        this.updateParams({playIndex})
                    }}
                    onAudioPause={() => {
                        ipcRenderer.send('musicName', 'LoveLive!')
                        ipcRenderer.send('setPlaying', false)
                    }}
                    onAudioListsChange={(playId, audioLists) => {
                        if (audioLists.length < 20) {
                            Store.set("playList", audioLists)
                        }
                        currentPlayList = audioLists
                        if (audioLists.length === 0) {
                            this.r.props.onClearAudioList()
                            currentMusicUniqueId = ""
                            Store.set("playId", "")
                        }
                        this.updateParams({
                            audioLists: audioLists,
                            // 歌单列表为空 或者 不在歌词界面时显示白色背景
                            theme: audioLists.length === 0 || !this.state.isShowDetail ? 'light' : 'dark'
                        })
                    }}
                    onAudioPlay={async audioInfo => {
                        try {
                            // 记录当前播放的歌曲唯一id
                            currentMusicUniqueId = audioInfo._id
                            this.props.dispatch(musicAction.playId(audioInfo._id))
                            // 当唯一id与记录的id不相同时，触发上报逻辑
                            if (Store.get("playId") !== audioInfo._id) {
                                Store.set("playId", audioInfo._id)
                                // 获取歌词页保存的map
                                const upReportSongInfo = Store.get("upReportSong")
                                if (upReportSongInfo) {
                                    // 清空map对应的存储
                                    Store.delete("upReportSong")
                                    // 生成可读的原map
                                    const map = AppUtils._objToStrMap(JSON.parse(upReportSongInfo))
                                    const reportInfo = WorkUtils.calcTrulyPlayInfo(map)
                                    // 当上报信息存在时
                                    if (reportInfo && currentMusicName) {
                                        // 赋值 切歌前的歌曲名
                                        reportInfo.name = currentMusicName
                                        // 发送到主线程进行上报
                                        ipcRenderer.send('upReportSong', reportInfo)
                                    }
                                }
                            }
                            AlbumHelper.findOneAlbumByAlbumId(this.props.chooseGroup, audioInfo.album).then(res => {
                                res && res._id && this.props.dispatch(musicAction.albumId(res._id))
                            })
                            await MusicHelper.refreshMusicTimestamp(audioInfo._id)
                            ipcRenderer.send('musicName', "当前播放:\n" + audioInfo.name)
                            ipcRenderer.send('setPlaying', true)
                            currentMusicName = audioInfo.name
                        } catch (e) {
                            console.log(e)
                        }
                        lrc.jpLrc = await this.requestLrc(audioInfo.lyric)
                        lrc.zhLrc = await this.requestLrc(audioInfo.trans)
                        lrc.romaLrc = await this.requestLrc(audioInfo.roma)
                    }}
                    onAudioVolumeChange={volume => {
                        Store.set('volume', Math.sqrt(volume))
                    }}
                    onCoverClick={_ => {
                        this.r.props.onClickCover()
                    }}
                    onAudioProgress={audioInfo => {
                        if (audioInfo) {
                            this.r.props.onAudioTimeChange({
                                cover: audioInfo.cover,
                                jpLrc: lrc.jpLrc,
                                zhLrc: lrc.zhLrc,
                                romaLrc: lrc.romaLrc,
                                _id: audioInfo._id,
                                name: audioInfo.name,
                                singer: audioInfo.singer,
                                currentTime: audioInfo.currentTime * 1000 + 300
                            })
                        }
                    }}
                    onAudioError={(error, currentPlayId, audioLists, audioInfo) => {
                        // 无法加载流则跳过
                        if (error.message === null || error.message === "MEDIA_ELEMENT_ERROR: Format error") {
                            return
                        }
                        switch (this.r.props.playMode) {
                            case 'singleLoop':
                                this.audioInstance?.load()
                                break
                            case 'orderLoop':
                                this.handleNextPlay(audioLists, audioInfo, 'orderLoop')
                                break
                            case 'order':
                                this.handleNextPlay(audioLists, audioInfo, 'order')
                                break
                            case 'shufflePlay':
                                if (error.code === 4) {
                                    this.audioInstance?.playNext()
                                }
                                break
                            default:
                                break
                        }
                    }}
                    extendsContent={this.renderDIYButton()}
                />
                <SelectDialog
                    hint={'请选择要添加的歌单'}
                    isShow={this.state.addListDisplay}
                    result={(id) => this.addListToMenu(id)}
                    list={this.state.menu}
                    close={() => this.setState({addListDisplay: false})}
                />
            </div>
        )
    }
}

function select(store) {
    return {
        playId: store.music.playId,
        chooseGroup: store.music.chooseGroup
    };
}

export default connect(select, null, null, {forwardRef: true})(AudioPlayer);
