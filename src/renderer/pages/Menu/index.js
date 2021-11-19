import React, {useEffect, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {Button, Table} from "antd";
import {WorkUtils} from "../../utils/WorkUtils";
import Store from "../../utils/Store";
import ImagePagination from "../../component/Pagin/index";
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import {AppUtils} from "../../utils/AppUtils";

const {connect} = require('react-redux');

const Menu = ({dispatch, chooseGroup, location}) => {

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

    const columns = [
        {
            title: `歌曲${tableData ? tableData.length : ''}`,
            dataIndex: 'song',
            key: 'song',
            render: (text, record, index) => {
                const active = index === rowHover
                return (
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <div>{text}</div>
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
                                onClick={() => iLove(record)}
                            />
                            <img
                                className={'btnFunc'}
                                src={btnFuncPic3}
                                onMouseOver={() => setBtnFuncPic3(Images.ICON_LOVE)}
                                onMouseOut={() => setBtnFuncPic3(Images.ICON_DIS_LOVE)}
                                onClick={() => addList(record)}
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
        if (info && info.music.length > 0) {
            const coverList = []
            const url = Store.get('url')
            info.music.map((item, index) => {
                coverList.push({
                    src: url + item['cover_path'],
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
                playMusic(index)
            },
            onContextMenu: event => {
                event.preventDefault()
                setNodeTree({
                    pageX: event.pageX,
                    pageY: event.pageY,
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
        console.log(music)
    }

    const addList = (music) => {
        console.log(music)
    }

    useEffect(() => {
        SongMenuHelper.findMenuById(location.state.id).then(res => {
            console.log(res)
            setInfo(res)
            const music = []
            res.music.map((item, index) => {
                music.push({
                    key: index,
                    song: item.name,
                    artist: item.artist,
                    time: '04:00',
                    music: item
                })
            })
            setTableData(music)
        })
    }, [location.state])

    return (
        <div className={'albumContainer'} onClick={() => setNodeDisplay(false)}>
            <div className={'albumTopContainer'}>
                {renderCover()}
                <div className={'albumTopRightContainer'}>
                    <p className={'albumName'}>{info && info.name ? info.name : ''}</p>
                    <p className={'albumText'}>{info && "创建日期: " + AppUtils.showValue(info.date)}</p>
                    <p className={'albumText'}>{info && info.music.length > 0 && "所属团组: " + WorkUtils.parseGroupName(info.music[0].group)}</p>
                    <Button
                        type="primary"
                        shape="round"
                        style={{width: '110px', marginTop: '25px'}}
                        icon={<img src={Images.ICON_DIS_PLAY} style={{marginRight: '6px', marginBottom: '3px'}}/>}
                        onClick={() => playMusic(0)}
                    >
                        播放全部
                    </Button>
                </div>
            </div>
            {renderMusicList()}
            {renderRightClick()}
        </div>
    )
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
    };
}

export default connect(select)(Menu);
