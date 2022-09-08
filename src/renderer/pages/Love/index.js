import React, {useEffect, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button, Table, Tabs} from "antd";
import {WorkUtils} from "../../utils/WorkUtils";
import Bus from "../../utils/Event";
import {SelectDialog} from "../../component/SelectDialog";
import {CustomDialog} from "../../component/CustomDialog";
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import {LoveHelper} from "../../dao/LoveHelper";

const {connect} = require('react-redux')
const {TabPane} = Tabs;

const Love = ({playId}) => {
    const [btnFuncPic1, setBtnFuncPic1] = useState(Images.ICON_DIS_PLAY)
    const [btnFuncPic2, setBtnFuncPic2] = useState(Images.ICON_DIS_COLLECT)
    const [btnFuncPic3, setBtnFuncPic3] = useState(Images.ICON_LOVE)

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
    const [refreshLove, setRefreshLove] = useState()

    const [confirmDialogShow, setConfirmDialogShow] = useState(false);
    const [chooseSong, setChooseSong] = useState()

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
                                onMouseOver={() => setBtnFuncPic3(Images.ICON_WILL_DIS_LOVE)}
                                onMouseOut={() => setBtnFuncPic3(Images.ICON_LOVE)}
                                onClick={() => disLove(record)}
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

    const onRowSelect = (record, index) => {
        return {
            onDoubleClick: () => {
                playMusic(index)
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
                <a className={'link'} onClick={() => playMusic(playIndex)}>播放</a>
                <a className={'link'} onClick={() => addList(music)}>添加到</a>
                <a className={'link'} onClick={() => disLove(music)}>移除</a>
            </div>
        )
        return nodeTree ? menu : null;
    }

    const playMusic = (playIndex) => {
        const musicList = []
        tableData.map(item => {
            musicList.push({
                id: item.music.id,
                group: item.music.group
            })
        })
        WorkUtils.playMenuByMusicIds(musicList, playIndex)
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

    const disLove = (music) => {
        setChooseSong(music.music)
        setConfirmDialogShow(true)
    }

    const onDelSong = (isDel) => {
        if (isDel) {
            LoveHelper.deleteSong(chooseSong).then(_ => {
                setRefreshLove(new Date().getTime())
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

    useEffect(() => {
        LoveHelper.findAllLove().then(res => {
            const musicList = []
            res.map((music, index) => {
                musicList.push({
                    key: index,
                    song: music.name,
                    artist: music.artist,
                    time: music.time,
                    music: music
                })
            })
            setTableData(musicList)
        })
    }, [refreshLove])

    return (
        <div className={'loveContainer'} onClick={() => setNodeDisplay(false)}>
            <div className={'loveTopContainer'}>
                <div className={'loveTopRightContainer'}>
                    <p className={'loveName'}>我喜欢</p>
                    {renderTabs()}
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: '110px'}}
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

export default connect(select)(Love);
