import React from 'react'
import ReactJkMusicPlayer from 'react-jinke-music-player'
import 'react-jinke-music-player/assets/index.css'
import Store from '../utils/Store'

let currentMusicUniqueId = ""

export default class AudioPlayer extends React.PureComponent {

    constructor(props) {
        super(props);
        this.audioInstance = null
        this.state = {
            params: {
                ...props
            },
            playIndex: 0,
            audioList: [],
            isShowDetail: false
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
                this.audioInstance.pause()
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

    render() {
        const {params, playIndex} = this.state
        params.playIndex = playIndex
        return (
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
                onAudioListsChange={(playId, audioLists) => {
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
                onAudioPlayTrackChange={((currentPlayId, audioLists, audioInfo) => {
                    if (audioInfo._id !== currentMusicUniqueId && audioLists.length > 0 && audioLists.length <= 20) {
                        currentMusicUniqueId = audioInfo._id
                        Store.set("playList", audioLists)
                    }
                })}
                onAudioPlay={audioInfo => Store.set("playId", audioInfo._id)}
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
            />
        )
    }
}
