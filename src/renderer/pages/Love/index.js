import React, {useRef, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button, Tabs} from "antd";
import Bus from "../../utils/Event";
import {CustomDialog} from "../../component/CustomDialog";
import {LoveHelper} from "../../dao/LoveHelper";
import {MusicRowList} from "../../component/MusicRowList";
import {WorkUtils} from "../../utils/WorkUtils";

const {connect} = require('react-redux')
const {TabPane} = Tabs;

const Love = ({playId}) => {

    const musicRowListRef = useRef()
    const [showDialogAndHandleMusic, setShowDialogAndHandleMusic] = useState({"show": false, "music": null})

    const tabCallback = (key) => {
        console.log(key)
    }

    const renderTabs = () => (
        <Tabs defaultActiveKey="1" onChange={tabCallback} tabBarStyle={{color: 'white'}}>
            <TabPane tab="歌曲" key="1"/>
            <TabPane tab="专辑" key="2"/>
            <TabPane tab="歌单" key="3"/>
        </Tabs>
    )

    return (
        <div className={'loveContainer'} onClick={() => musicRowListRef.current?.closeNode()}>
            <div className={'loveTopContainer'}>
                <div className={'loveTopRightContainer'}>
                    <p className={'loveName'}>我喜欢</p>
                    {/*{renderTabs()}*/}
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: '110px', marginTop: '10px'}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => musicRowListRef.current?.playFirst()}
                    >
                        播放全部
                    </Button>
                </div>
            </div>
            <MusicRowList
                ref={musicRowListRef}
                playId={playId}
                onRefreshData={() =>
                    WorkUtils.findLoveList(table => musicRowListRef.current?.setData(table))
                }
                onDisLove={(music) => {
                    showDialogAndHandleMusic.show = true
                    showDialogAndHandleMusic.music = music.music
                    setShowDialogAndHandleMusic({...showDialogAndHandleMusic})
                }}
                onDelSong={(music) => {
                    showDialogAndHandleMusic.show = true
                    showDialogAndHandleMusic.music = music.music
                    setShowDialogAndHandleMusic({...showDialogAndHandleMusic})
                }}
            />
            <CustomDialog
                isShow={showDialogAndHandleMusic.show}
                hint={'取消喜欢歌曲？'}
                result={(isDel) => {
                    if (isDel) {
                        LoveHelper.deleteSong(showDialogAndHandleMusic.music).then(_ => {
                            musicRowListRef.current?.refresh()
                        }).catch(err => {
                            Bus.emit('onNotification', err)
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

export default connect(select)(Love);
