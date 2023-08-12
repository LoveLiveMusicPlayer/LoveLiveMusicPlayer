import React, {useRef, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button} from "antd";
import {MusicRowList} from "../../component/MusicRowList";
import {CustomDialog} from "../../component/CustomDialog";
import {MusicHelper} from "../../dao/MusicHelper";
import {WorkUtils} from "../../utils/WorkUtils";
import {LoveHelper} from "../../dao/LoveHelper";
import Bus from "../../utils/Event";

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
                    <p className={'historyName'}>最近播放</p>
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: '110px', marginTop: '10px'}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => musicRowListRef.current?.play()}>
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
                        if (showDialogAndHandleMusic.state === "deleteMusic") {
                            MusicHelper.refreshMusicTimestamp(showDialogAndHandleMusic.music._id, 0).then(_ => {
                                musicRowListRef.current?.refresh()
                            })
                        } else {
                            LoveHelper.deleteSong(showDialogAndHandleMusic.music).then(_ => {
                                musicRowListRef.current?.refresh()
                            }).catch(err => {
                                Bus.emit('onNotification', err)
                            })
                        }
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
