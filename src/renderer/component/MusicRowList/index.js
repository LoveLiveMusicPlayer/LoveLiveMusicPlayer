import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {Table} from "antd";
import * as Images from "../../public/Images";
import {WorkUtils} from "../../utils/WorkUtils";
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import Bus from "../../utils/Event";
import {SelectDialog} from "../SelectDialog";
import {LoveHelper} from "../../dao/LoveHelper";
import './index.css'
import Store from '../../utils/Store';

export const MusicRowList = forwardRef(({playId, onRefreshData, onDisLove, onDelSong}, ref) => {

    const [btnFuncPic1, setBtnFuncPic1] = useState(Images.ICON_DIS_PLAY)
    const [btnFuncPic2, setBtnFuncPic2] = useState(Images.ICON_DIS_COLLECT)

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

    useImperativeHandle(ref, () => ({
        refresh: () => {
            onRefreshData()
        },

        play: () => {
            const mode = Store.get('playMode') || 'orderLoop'
            const playIndex = mode == "shufflePlay" ? Math.floor(Math.random() * tableData.length) : 0
            playMusic(playIndex)
        },

        setData: (musicList) => {
            setTableData(musicList)
        },

        closeNode: () => {
            setNodeDisplay(false)
        }
    }))

    useEffect(() => {
        const onClickBody = () => {
            setNodeDisplay(false)
        }
        Bus.addListener('onClickBody', onClickBody)
        onRefreshData()
        return () => Bus.removeListener('onClickBody', onClickBody)
    }, [])

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
                                src={record.music.isLove ? Images.ICON_LOVE : Images.ICON_DIS_LOVE}
                                onClick={() => onToggleLove(record)}
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
                <a className={'link'} onClick={() => onDelSong(music, playIndex)}>移除</a>
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
        if (tableData.length <= playIndex) {
            return
        }
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

    const onToggleLove = (record) => {
        if (record.music.isLove === false) {
            // 插入我喜欢列表
            LoveHelper.insertSongToLove(record.music).then(_ => {
                onRefreshData()
                Bus.emit('onNotification', '已添加到我喜欢')
            })
        } else {
            onDisLove(record)
        }
    }

    return (
        <>
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                onRow={onRowSelect}
            />
            {renderRightClick()}
            <SelectDialog
                hint={'请选择要添加的歌单'}
                isShow={addListDisplay}
                result={addToList}
                list={menu}
                close={() => setAddListDisplay(false)}
            />
        </>
    )
})
