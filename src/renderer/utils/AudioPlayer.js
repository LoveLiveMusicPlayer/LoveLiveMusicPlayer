import React from 'react'
import ReactJkMusicPlayer from 'react-jinke-music-player'
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
import {ipcRenderer} from "electron";
import {musicAction} from "../actions/music";
import {AlbumHelper} from "../dao/AlbumHelper";

const {connect} = require('react-redux')

let currentMusicUniqueId = ""
let currentPlayList = []

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
            menu: []
        }
        this.r = null
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

    onTogglePlay = () => {
        this.audioInstance?.togglePlay()
    }

    onPrevPlay = () => {
        if (currentPlayList.length > 1) {
            this.audioInstance?.playPrev()
        } else this.audioInstance?.load()
    }

    onNextPlay = () => {
        if (currentPlayList.length > 1) {
            this.audioInstance?.playNext()
        } else this.audioInstance?.load()
    }

    content = () => {
        return (
            <Menu style={{marginBottom: 25}}>
                <Menu.Item key={"addTo"}>
                    <a onClick={async () => {
                        if (!AppUtils.isEmpty(currentMusicUniqueId)) {
                            SongMenuHelper.findAllMenu().then(menu => {
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
        )
    }

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

    render() {
        const {params, playIndex} = this.state
        params.playIndex = playIndex
        return (
            <div style={{position: 'relative', background: 'red'}}>
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
                    onAudioPause={() => ipcRenderer.send('musicName', 'LoveLive!')}
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
                    onAudioPlay={audioInfo => {
                        ipcRenderer.send('musicName', "当前播放:\n" + audioInfo.name)
                        currentMusicUniqueId = audioInfo._id
                        this.props.dispatch(musicAction.playId(audioInfo._id))
                        Store.set("playId", audioInfo._id)
                        AlbumHelper.findOneAlbumByAlbumId(this.props.chooseGroup, audioInfo.album).then(res => {
                            res._id && this.props.dispatch(musicAction.albumId(res._id))
                        })
                    }}
                    onAudioVolumeChange={volume => {
                        Store.set('volume', Math.sqrt(volume))
                    }}
                    onCoverClick={_ => {
                        this.r.props.onClickCover()
                    }}
                    onAudioProgress={audioInfo => {
                        if (audioInfo) {
                            this.r.props.onAudioTimeChange(audioInfo)
                        }
                    }}
                    onAudioError={(error, currentPlayId, audioLists, audioInfo) => {
                        // 无法加载流则跳过
                        if (error.message === "MEDIA_ELEMENT_ERROR: Format error") {
                            return
                        }
                        switch (this.r.props.playMode) {
                            case 'singleLoop':
                                this.audioInstance?.load()
                                break
                            case 'orderLoop':
                                this.audioInstance?.playNext()
                                break
                            case 'order':
                                let count = 0
                                audioLists.map((item, index) => {
                                    if (item._id === audioInfo._id) {
                                        count = index
                                    }
                                })
                                if (count !== audioLists.length - 1) {
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
