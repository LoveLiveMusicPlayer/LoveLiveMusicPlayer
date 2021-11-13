import React from 'react'
import ReactJkMusicPlayer from 'react-jinke-music-player'
import 'react-jinke-music-player/assets/index.css'

// 正在处理删除逻辑
let isHandle = false

export default class AudioPlayer extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            params: {
                ...props
            },
            playIndex: 0,
            audioList: []
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
            isHandle = false
            this.updateParams({
                clearPriorAudioLists: true,
                quietUpdate: true,
                audioLists: [...this.state.params.audioLists, song],
                playIndex: this.state.playIndex
            })
        }
    }

    // 切换专辑
    onChangeAudioList = (arr) => {
        this.setState({playIndex: 0})
        this.updateParams({
            clearPriorAudioLists: true,
            audioLists: arr,
            playIndex: 0
        })
    }

    onChangeKey = (key) => {
        const data = {
            ...this.state.params,
            [key]: !this.state.params[key],
        }
        if (key === 'light' || key === 'dark') {
            data.theme = key
        }
        if (key === 'full' || key === 'mini') {
            data.mode = key
        }
        this.setState({params: data})
    }

    // 更新播放器参数
    updateParams = (params) => {
        const data = {
            ...this.state.params,
            ...params,
        }
        this.setState({
            params: data,
        })
    }

    render() {
        const {params, playIndex} = this.state
        params.playIndex = playIndex
        return (
            <ReactJkMusicPlayer
                ref={(ref) => this.r = ref}
                style={{marginTop: '100px'}}
                {...params}
                onModeChange={(mode) => {
                    this.updateParams({mode})
                }}
                onPlayModeChange={(playMode) => {
                    this.updateParams({playMode})
                }}
                onPlayIndexChange={(playIndex) => {
                    if (!isHandle) {
                        this.setState({playIndex: playIndex})
                        this.updateParams({playIndex})
                    }
                }}
                onAudioListsChange={(playId, audioLists) => {
                    this.updateParams({audioLists})
                }}
                onDeleteChange={truePlayIndex => {
                    isHandle = true
                    this.setState({playIndex: truePlayIndex})
                }}
                onAudioPlay={audioInfo => {
                    // console.log(audioInfo)
                }}
                onCoverClick={(mode, audioLists, audioInfo) => {
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
