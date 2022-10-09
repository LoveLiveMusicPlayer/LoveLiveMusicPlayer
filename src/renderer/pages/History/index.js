import React, {useRef, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button} from "antd";
import {MusicRowList} from "../../component/MusicRowList";
import {CustomDialog} from "../../component/CustomDialog";
import {MusicHelper} from "../../dao/MusicHelper";
import {WorkUtils} from "../../utils/WorkUtils";

const {connect} = require('react-redux')

const History = ({playId}) => {

    const musicRowListRef = useRef()
    const [showDialogAndHandleMusic, setShowDialogAndHandleMusic] = useState({
        "show": false,
        "music": null,
        "state": "disLove"
    })

    return (
        <div className={'historyContainer'}>
            <div className={'historyTopContainer'}>
                <div className={'historyTopRightContainer'}>
                    <p className={'loveName'}>最近播放</p>
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: '110px', marginTop: '10px'}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => {
                        }}
                    >
                        播放全部
                    </Button>
                </div>
            </div>
            <MusicRowList
                ref={musicRowListRef}
                playId={playId}
                onRefreshData={() => {
                    WorkUtils.findHistoryList((table) => musicRowListRef.current?.setData(table))
                }}
                onDisLove={(music) => {
                    console.log(music)
                    showDialogAndHandleMusic.show = true
                    showDialogAndHandleMusic.music = music.music
                    showDialogAndHandleMusic.state = "disLove"
                    setShowDialogAndHandleMusic({...showDialogAndHandleMusic})
                }}
                onDelSong={(music) => {
                    showDialogAndHandleMusic.show = true
                    showDialogAndHandleMusic.music = music.music
                    showDialogAndHandleMusic.state = "deleteMusic"
                    setShowDialogAndHandleMusic({...showDialogAndHandleMusic})
                }}
            />
            <CustomDialog
                isShow={showDialogAndHandleMusic.show}
                hint={showDialogAndHandleMusic.state === "deleteMusic" ? "确认删除歌曲？" : '取消喜欢歌曲？'}
                result={(isDel) => {
                    if (isDel) {
                        MusicHelper.refreshMusicTimestamp(showDialogAndHandleMusic.music._id, 0).then(_ => {
                            musicRowListRef.current?.refresh()
                        })
                    }
                }}
                close={() => {
                    showDialogAndHandleMusic.show = false
                    setShowDialogAndHandleMusic({...showDialogAndHandleMusic})
                }}
            />
        </div>
    )
}


function select(store) {
    return {
        playId: store.music.playId
    };
}

export default connect(select)(History);