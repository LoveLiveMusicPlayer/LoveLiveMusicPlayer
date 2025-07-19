import React, {useRef, useState} from 'react';
import {useParams} from "react-router-dom";
import './index.css'
import Store from '../../utils/Store'
import ImagePagination from "../../component/Pagin/index";
import {Button} from 'antd'
import {WorkUtils} from "../../utils/WorkUtils";
import * as Images from '../../public/Images'
import Bus from "../../utils/Event";
import {LoveHelper} from "../../dao/LoveHelper";
import {MusicRowList} from "../../component/MusicRowList";
import {CustomDialog} from "../../component/CustomDialog";

const {connect} = require('react-redux');

const Album = ({chooseGroup, playId}) => {
    let params = useParams()
    const musicRowListRef = useRef()

    // 专辑信息详情
    const [info, setInfo] = useState()
    const [showDialogAndHandleMusic, setShowDialogAndHandleMusic] = useState({"show": false, "music": null})

    const renderCover = () => {
        if (info) {
            const coverList = []
            const url = Store.get('url')
            info['cover_path'].map((item, index) => {
                coverList.push({
                    src: url + item,
                    id: index
                })
            })
            return (
                <ImagePagination
                    key={info.name}
                    pages={coverList}
                    playButton={false}
                    whiteCover={false}
                    effect={false}
                    imgSide={200}
                />
            )
        } else return null
    }

    return (
        <div className={'albumContainer'} onClick={() => musicRowListRef.current?.closeNode()}>
            <div className={'albumTopContainer'}>
                {renderCover()}
                <div className={'albumTopRightContainer'}>
                    <p className={'albumName'}>{info && info.name}</p>
                    <p className={'albumText'}>{info && "出版日期: " + info.date}</p>
                    <p className={'albumText'}>{info && "歌曲分类: " + info.category}</p>
                    <p className={'albumText'}>{info && "所属团组: " + WorkUtils.parseGroupName(info.group)}</p>
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: 110, marginTop: 10}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => WorkUtils.playAlbumByUniqueId(info._id)}
                    >
                        播放全部
                    </Button>
                </div>
            </div>
            <MusicRowList
                ref={musicRowListRef}
                playId={playId}
                onRefreshData={() =>
                    WorkUtils.findAlbumList(
                        params.id,
                        chooseGroup,
                        (info) => setInfo(info),
                        (table) => musicRowListRef.current?.setData(table)
                    )
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
                        LoveHelper.deleteSong(showDialogAndHandleMusic.music._id).then(_ => {
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
        chooseGroup: store.music.chooseGroup,
        playId: store.music.playId
    };
}

export default connect(select)(Album);
