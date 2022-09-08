import React, {useEffect, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button, Table} from "antd";
import {WorkUtils} from "../../utils/WorkUtils";
import Store from "../../utils/Store";
import ImagePagination from "../../component/Pagin/index";
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import {AppUtils} from "../../utils/AppUtils";
import Bus from "../../utils/Event";
import {SelectDialog} from "../../component/SelectDialog";
import {CustomDialog} from "../../component/CustomDialog";
import {LoveHelper} from "../../dao/LoveHelper";
import {useLocation, useParams} from "react-router-dom";

const {connect} = require('react-redux');
let currentMenuName = null

const Menu = ({playId}) => {

    const [btnFuncPic1, setBtnFuncPic1] = useState(Images.ICON_DIS_PLAY)
    const [btnFuncPic2, setBtnFuncPic2] = useState(Images.ICON_DIS_COLLECT)
    const [btnFuncPic3, setBtnFuncPic3] = useState(Images.ICON_DIS_LOVE)

    const [info, setInfo] = useState()
    const [tableData, setTableData] = useState()
    const [nodeTree, setNodeTree] = useState({
        pageX: 0,
        pageY: 0,
        music: '',
    })

    const [nodeDisplay, setNodeDisplay] = useState(false)
    const [rowHover, setRowHover] = useState()
    const [showCovers, setShowCovers] = useState([])

    const [group, setGroup] = useState([])
    const [category, setCategory] = useState([])

    const [addListDisplay, setAddListDisplay] = useState(false)
    const [willAddListMusic, setWillAddListMusic] = useState()
    const [menu, setMenu] = useState([])
    const [refreshMenu, setRefreshMenu] = useState()

    const [confirmDialogShow, setConfirmDialogShow] = useState(false);
    const [chooseSong, setChooseSong] = useState()
    let location = useLocation();
    let params = useParams();

    const columns = [
        {
            title: `歌曲${tableData ? tableData.length : ''}`,
            dataIndex: 'song',
            key: 'song',
            render: (text, record, index) => {
                const active = index === rowHover
                const isCurrentPlay = record.music._id === playId
                return (
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        {
                            isCurrentPlay ?
                                <img src={Images.ICON_PLAY} width={20} height={20} style={{marginRight: 10}}/> : null
                        }
                        <p style={{margin: 0, fontWeight: isCurrentPlay ? 800 : 400}}>{text}</p>
                        <div className={'btnFuncContainer'} style={{visibility: active ? 'visible' : 'hidden'}}>
                            <img
                                className={'btnFunc'}
                                src={btnFuncPic1}
                                onMouseOver={() => setBtnFuncPic1(Images.ICON_PLAY)}
                                onMouseOut={() => setBtnFuncPic1(Images.ICON_DIS_PLAY)}
                                onClick={() => playMusic(index)}
                            />
                            <img
                                className={'btnFunc'}
                                src={btnFuncPic2}
                                onMouseOver={() => setBtnFuncPic2(Images.ICON_COLLECT)}
                                onMouseOut={() => setBtnFuncPic2(Images.ICON_DIS_COLLECT)}
                                onClick={() => addList(record)}
                            />
                            <img
                                className={'btnFunc'}
                                src={btnFuncPic3}
                                onMouseOver={() => setBtnFuncPic3(Images.ICON_LOVE)}
                                onMouseOut={() => setBtnFuncPic3(Images.ICON_DIS_LOVE)}
                                onClick={() => iLove(record)}
                            />
                        </div>
                    </div>
                )
            }
        },
        {
            title: '艺术家',
            dataIndex: 'artist',
            key: 'artist',
        },
        {
            title: '时长',
            dataIndex: 'time',
            key: 'time',
        }
    ];

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

    const onRowSelect = (record, index) => {
        return {
            onDoubleClick: () => {
                playMusic(index)
            },
            onContextMenu: event => {
                event.preventDefault()
                setNodeTree({
                    pageX: event.pageX,
                    pageY: WorkUtils.calcRightClickPosition(event, 4),
                    music: record,
                    playIndex: index
                })
                setNodeDisplay(true)
            },
            onMouseEnter: () => {
                const key = record.key
                if (rowHover !== key) {
                    setRowHover(key)
                }
            },
            onMouseLeave: () => {
                const key = record.key
                if (rowHover === key) {
                    setRowHover(null)
                }
            },
        }
    }

    const renderMusicList = () => {
        return (
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                onRow={onRowSelect}
            />
        )
    }

    const renderRightClick = () => {
        const {pageX, pageY, music, playIndex} = nodeTree
        const style = {
            width: '100px',
            position: 'absolute',
            left: `${pageX - 250}px`,
            top: `${pageY - 80}px`,
            display: nodeDisplay ? 'flex' : 'none',
            flexDirection: 'column',
            backgroundColor: '#fff',
            borderRadius: '8px'
        }
        const menu = (
            <div style={style}>
                <a className={'link'} onClick={() => playMusic(playIndex)}>播放</a>
                <a className={'link'} onClick={() => addList(music)}>添加到</a>
                <a className={'link'} onClick={() => iLove(music)}>我喜欢</a>
                <a className={'link'} onClick={() => {
                    setChooseSong(playIndex)
                    setConfirmDialogShow(true)
                }}>删除</a>
            </div>
        )
        return nodeTree ? menu : null;
    }

    const playMusic = (playIndex) => {
        const musicList = []
        info.music.map(item => {
            musicList.push({
                id: item.id,
                group: item.group
            })
        })
        WorkUtils.playMenuByMusicIds(musicList, playIndex)
    }

    const iLove = (music) => {
        LoveHelper.insertSongToLove(music.music).then(_ => {
            setRefreshMenu(new Date().getTime())
            Bus.emit('onNotification', '已添加到我喜欢')
        })
    }

    const addList = (music) => {
        SongMenuHelper.findPcMenu().then(res => {
            if (res.length > 0) {
                setAddListDisplay(true)
                setWillAddListMusic(music.music)
                setMenu(res)
            } else {
                Bus.emit('onNotification', '请先新增歌单')
            }
        })
    }

    const addToList = (id) => {
        SongMenuHelper.insertSongToMenu(id, willAddListMusic).then(_ => {
            Bus.emit('onNotification', '已添加到歌单')
        })
    }

    const onDelSong = (needDel) => {
        if (needDel) {
            SongMenuHelper.deleteSong(info.id, chooseSong).then(_ => {
                setRefreshMenu(new Date().getTime())
            }).catch(err => {
                Bus.emit('onNotification', err)
            })
        }
    }

    useEffect(() => {
        const onClickBody = () => {
            setNodeDisplay(false)
        }
        Bus.addListener('onClickBody', onClickBody)
        return () => Bus.removeListener('onClickBody', onClickBody)
    }, [])

    const findMenuList = async () => {
        await WorkUtils.findMySongList(Number(params.id),
            (info) => setInfo(info),
            (table) => setTableData(table),
            (gp) => setGroup(gp),
            (cate) => setCategory(cate)
        )
    }

    useEffect(() => {
        findMenuList()
    }, [location.state, refreshMenu, params])

    return (
        <div className={'albumContainer'} onClick={() => setNodeDisplay(false)}>
            <div className={'albumTopContainer'}>
                {renderCover(info)}
                <div className={'albumTopRightContainer'}>
                    <p className={'albumName'}>{info && info.name ? info.name : ''}</p>
                    <p className={'albumText'}>{info && "创建日期: " + AppUtils.showValue(info.date)}</p>
                    <p className={'albumText'}>{info && "歌曲标签: " + AppUtils.arrToString(category)}</p>
                    <p className={'albumText'}>{info && "所属团组: " + AppUtils.arrToString(group)}</p>
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: 110, marginTop: 10}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => playMusic(0)}
                    >
                        播放全部
                    </Button>
                </div>
            </div>
            {renderMusicList()}
            {renderRightClick()}
            <SelectDialog
                hint={'请选择要添加的歌单'}
                isShow={addListDisplay}
                result={addToList}
                list={menu}
                close={() => setAddListDisplay(false)}
            />
            <CustomDialog
                isShow={confirmDialogShow}
                hint={'确认删除歌曲？'}
                result={onDelSong}
                close={() => setConfirmDialogShow(false)}
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
