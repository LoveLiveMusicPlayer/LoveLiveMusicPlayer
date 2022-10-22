import React, {useEffect, useRef, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button} from "antd";
import {WorkUtils} from "../../utils/WorkUtils";
import Store from "../../utils/Store";
import ImagePagination from "../../component/Pagin/index";
import {AppUtils} from "../../utils/AppUtils";
import Bus from "../../utils/Event";
import {CustomDialog} from "../../component/CustomDialog";
import {LoveHelper} from "../../dao/LoveHelper";
import {useLocation, useParams} from "react-router-dom";
import {MusicRowList} from "../../component/MusicRowList";
import {SongMenuHelper} from "../../dao/SongMenuHelper";

const {connect} = require('react-redux');
let currentMenuName = null

const Menu = ({playId}) => {
    const musicRowListRef = useRef()

    const [info, setInfo] = useState()

    const [showCovers, setShowCovers] = useState([])

    const [group, setGroup] = useState([])
    const [category, setCategory] = useState([])
    const [chooseSong, setChooseSong] = useState()

    const [showDialogAndHandleMusic, setShowDialogAndHandleMusic] = useState({
        "show": false,
        "music": null,
        "state": ""
    })

    let location = useLocation();
    let params = useParams();

    useEffect(() => {
        currentMenuName = null
    }, [])

    const renderCover = () => {
        if (info && info.music.length > 0) {
            if (currentMenuName !== info.name) {
                const coverList = []
                const url = Store.get('url')
                const set = new Set()
                info.music.map((item, index) => {
                    const path = url + item['base_url'] + item['cover_path']
                    set.add(path)
                })
                Array.from(set).map((item, index) => {
                    if (coverList.length < 10) {
                        coverList.push({
                            src: item,
                            id: index
                        })
                    }
                })
                setShowCovers(coverList)
                currentMenuName = info.name
            }
            return (
                <ImagePagination
                    key={info.name}
                    pages={showCovers}
                    playButton={false}
                    whiteCover={false}
                    effect={false}
                    imgSide={200}
                />
            )
        } else return null
    }

    useEffect(() => {
        musicRowListRef.current?.refresh()
    }, [location.state, params])

    return (
        <div className={'albumContainer'} onClick={() => musicRowListRef.current?.closeNode()}>
            <div className={'albumTopContainer'}>
                {renderCover(info)}
                <div className={'albumTopRightContainer'}>
                    <p className={'albumName'}>{info && info.name ? info.name : ''}</p>
                    <p className={'albumText'}>{info && "创建日期: " + AppUtils.showValue(info.date)}</p>
                    <p className={'albumText'}>{info && "歌曲标签: " + WorkUtils.arrToString(category)}</p>
                    <p className={'albumText'}>{info && "所属团组: " + WorkUtils.arrToString(group)}</p>
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: 110, marginTop: 10}}
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
                    WorkUtils.findMySongList(Number(params.id),
                        (info) => setInfo(info),
                        (table) => musicRowListRef.current?.setData(table),
                        (gp) => setGroup(gp),
                        (cate) => setCategory(cate)
                    )
                }
                onDisLove={(music) => {
                    showDialogAndHandleMusic.show = true
                    showDialogAndHandleMusic.music = music.music
                    showDialogAndHandleMusic.state = "disLove"
                    setShowDialogAndHandleMusic({...showDialogAndHandleMusic})
                }}
                onDelSong={(music, playIndex) => {
                    setChooseSong(playIndex)
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
                            SongMenuHelper.deleteSong(info.id, chooseSong).then(_ => {
                                musicRowListRef.current?.refresh()
                            }).catch(err => {
                                Bus.emit('onNotification', err)
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

export default connect(select)(Menu);
