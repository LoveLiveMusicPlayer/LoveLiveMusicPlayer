import React, {useEffect, useState} from 'react';
import {useHistory} from "react-router-dom";
import {AlbumHelper} from "../../dao/AlbumHelper";
import './index.css'
import Store from '../../utils/Store'
import ImagePagination from "../../component/Pagin/index";
import {Button, Table} from 'antd'
import {MusicHelper} from "../../dao/MusicHelper";
import {WorkUtils} from "../../utils/WorkUtils";
import * as Images from '../../public/Images'
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import {SelectDialog} from "../../component/SelectDialog";
import Bus from "../../utils/Event";
import {LoveHelper} from "../../dao/LoveHelper";

const {connect} = require('react-redux');

const Album = ({dispatch, chooseGroup, location, playId}) => {
    let history = useHistory()

    // 三个功能按钮图片
    const [btnFuncPic1, setBtnFuncPic1] = useState(Images.ICON_DIS_PLAY)
    const [btnFuncPic2, setBtnFuncPic2] = useState(Images.ICON_DIS_COLLECT)
    const [btnFuncPic3, setBtnFuncPic3] = useState(Images.ICON_DIS_LOVE)

    // 专辑信息详情
    const [info, setInfo] = useState()
    // 专辑列表数据
    const [tableData, setTableData] = useState()
    const [nodeTree, setNodeTree] = useState({
        pageX: 0,
        pageY: 0,
        music: '',
    })
    const [nodeDisplay, setNodeDisplay] = useState(false)
    const [rowHover, setRowHover] = useState()
    const [addListDisplay, setAddListDisplay] = useState(false)
    const [willAddListMusic, setWillAddListMusic] = useState()
    const [menu, setMenu] = useState([])
    const [refreshAlbum, setRefreshAlbum] = useState()

    useEffect(() => {
        const onClickBody = () => {
            setNodeDisplay(false)
        }
        Bus.addListener('onClickBody', onClickBody)
        return () => Bus.removeListener('onClickBody', onClickBody)
    }, [])

    // 查询当前专辑全部的歌曲信息
    const findAlbumList = async () => {
        const album = await AlbumHelper.findOneAlbumByUniqueId(location.state.id)
        setInfo(album)
        const musicList = await MusicHelper.findAllMusicByAlbumId(chooseGroup, album.id)
        const tableData = []
        const loveList = await LoveHelper.findAllLove()
        musicList.map((music, index) => {
            let isLove = false
            loveList && loveList.map(item => {
                if (music._id === item._id) {
                    isLove = true
                }
            })
            tableData.push({
                key: index,
                song: music.name,
                artist: music.artist,
                time: music.time,
                isLove: isLove,
                music: music
            })
        })
        setTableData(tableData)
    }

    useEffect(() => {
        findAlbumList()
    }, [refreshAlbum])

    const columns = [
        {
            title: `歌曲${tableData && tableData ? tableData.length : '1'}`,
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
                                onClick={() => playMusic(record, index)}
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

    const onRowSelect = (record, index) => {
        return {
            onDoubleClick: () => {
                playMusic(record, index)
            },
            onContextMenu: event => {
                event.preventDefault()
                setNodeTree({
                    pageX: event.pageX,
                    pageY: WorkUtils.calcRightClickPosition(event, 3),
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
                <a className={'link'} onClick={() => playMusic(music, playIndex)}>播放</a>
                <a className={'link'} onClick={() => addList(music)}>添加到</a>
                <a className={'link'} onClick={() => iLove(music)}>我喜欢</a>
            </div>
        )
        return nodeTree ? menu : null;
    }

    const playMusic = (music, playIndex) => {
        WorkUtils.playAlbumByAlbumId(chooseGroup, music.music.album, playIndex)
    }

    const iLove = (music) => {
        // 插入我喜欢列表
        LoveHelper.insertSongToLove(music.music).then(_ => {
            setRefreshAlbum(new Date().getTime())
            Bus.emit('onNotification', '已添加到我喜欢')
        })
    }

    const addList = (music) => {
        SongMenuHelper.findAllMenu().then(res => {
            if (res.length > 0) {
                setAddListDisplay(true)
                setWillAddListMusic(music.music)
                setMenu(res)
            } else {
                Bus.emit('onNotification', '请先新增歌单')
            }
        })
    }

    // 添加到歌单
    const addToList = (id) => {
        SongMenuHelper.insertSongToMenu(id, willAddListMusic).then(_ => {
            Bus.emit('onNotification', '已添加到歌单')
        })
    }

    return (
        <div className={'albumContainer'} onClick={() => setNodeDisplay(false)}>
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
                        style={{width: '110px'}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => WorkUtils.playAlbumByUniqueId(info._id)}
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
