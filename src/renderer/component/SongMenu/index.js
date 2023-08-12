import React, {useEffect, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import {TextDialog} from "../TextDialog";
import Bus from '../../utils/Event'
import {WorkUtils} from "../../utils/WorkUtils";
import {CustomDialog} from "../CustomDialog";
import {AppUtils} from "../../utils/AppUtils";
import Store from "../../utils/Store";

export const SongMenu = ({chooseItem, onChooseItem}) => {

    const [addMenuPic, setAddMenuPic] = useState(Images.ICON_MENU_ADD_UNSELECT)
    const [menuList, setMenuList] = useState([])
    const [nameMenuDialogShow, setNameMenuDialogShow] = useState(false)
    const [refreshMenu, setRefreshMenu] = useState()

    const [nodeTree, setNodeTree] = useState({
        pageX: 0,
        pageY: 0,
        music: '',
    })
    const [nodeDisplay, setNodeDisplay] = useState(false)

    const [confirmDialogShow, setConfirmDialogShow] = useState(false);
    const [chooseMenu, setChooseMenu] = useState()

    useEffect(() => {
        const onClickBody = () => {
            setNodeDisplay(false)
        }
        const onMenuDataChanged = () => {
            setRefreshMenu(new Date().getTime())
        }
        Bus.addListener('onClickBody', onClickBody)
        Bus.addListener('onMenuDataChanged', onMenuDataChanged)
        return () => {
            Bus.removeListener('onClickBody', onClickBody)
            Bus.removeListener('onMenuDataChanged', onMenuDataChanged)
        }
    }, [])

    useEffect(() => {
        SongMenuHelper.findAllMenu().then(res => {
            setMenuList(res)
        })
    }, [refreshMenu])

    const renderMenuList = () => {
        const container = []
        menuList.map((item, index) => {
            const pic = item.id <= 100 ? Images.ICON_MENU_COMPUTER : Images.ICON_MENU_PHONE
            container.push(
                <div
                    className={chooseItem === item.id ? 'selectContainer' : 'unselectContainer'}
                    onClick={() => {
                        const chooseIndex = index + 1;
                        if (chooseIndex > 0) {
                            onChooseItem(item.id)
                        } else {
                            onChooseItem(chooseIndex)
                        }
                    }}
                    key={index}
                    onContextMenu={event => onRightClick(event, item)}
                >
                    <img className={'customPic'} src={pic}/>
                    <p className={'customText'} style={{marginLeft: '10px'}}>{item.name}</p>
                </div>
            )
        })
        return <div className={'menuContainer'}>{container}</div>
    }

    const onAddMenu = (text) => {
        SongMenuHelper.insertMenu({
            name: text,
            music: []
        }).then(_ => {
            setRefreshMenu(new Date().getTime())
        })
    }

    const onDelMenu = (needDel) => {
        if (needDel) {
            SongMenuHelper.deleteMenu(chooseMenu).then(_ => {
                setRefreshMenu(new Date().getTime())
            })
        }
    }

    const onRightClick = (event, music) => {
        event.preventDefault()
        setNodeTree({
            pageX: event.pageX,
            pageY: WorkUtils.calcRightClickPosition(event, 2),
            music: music
        })
        setNodeDisplay(true)
    }

    const renderRightClick = () => {
        const {pageX, pageY, music} = nodeTree
        if (chooseMenu !== music.id) {
            setChooseMenu(music.id)
        }
        const style = {
            width: '100px',
            position: 'absolute',
            left: `${pageX}px`,
            top: `${pageY - 80}px`,
            display: nodeDisplay ? 'flex' : 'none',
            flexDirection: 'column',
            backgroundColor: '#fff',
            borderRadius: '8px'
        }
        const menu = (
            <div style={style}>
                <a className={'link'} onClick={() => playAll(music.music)}>播放</a>
                <a className={'link'} onClick={() => {
                    setConfirmDialogShow(true)
                }}>删除</a>
            </div>
        )
        return nodeTree ? menu : null;
    }

    const playAll = (music) => {
        const musicList = []
        music.map(item => {
            musicList.push({
                id: item.id,
                group: item.group
            })
        })
        const mode = Store.get('playMode') || 'orderLoop';
        const playIndex = mode == "shufflePlay" ? Math.floor(Math.random() * music.length) : 0
        const result = WorkUtils.playMenuByMusicIds(musicList, playIndex)
        if (!AppUtils.isNull(result?.message)) {
            Bus.emit('onNotification', result.message)
        }
    }

    return (
        <div className={'songListContainer'} onClick={() => setNodeDisplay(false)}>
            <div className={'selectContainer'} style={{margin: 0, background: 'transparent'}}>
                <p className={'customTitleText'}>我的音乐</p>
            </div>
            <div className={chooseItem === -3 ? 'selectContainer' : 'unselectContainer'}
                 onClick={() => onChooseItem(-3)}>
                <img className={'customPic'} src={Images.ICON_FUNC_MUSIC}/>
                <p className={'customText'} style={{paddingLeft: '10px'}}>音乐馆</p>
            </div>
            <div className={chooseItem === -2 ? 'selectContainer' : 'unselectContainer'}
                 onClick={() => onChooseItem(-2)}>
                <img className={'customPic'} src={Images.ICON_FUNC_LOVE}/>
                <p className={'customText'} style={{paddingLeft: '10px'}}>我喜欢</p>
            </div>
            <div className={chooseItem === -1 ? 'selectContainer' : 'unselectContainer'}
                 onClick={() => onChooseItem(-1)}>
                <img className={'customPic'} src={Images.ICON_FUNC_HISTORY}/>
                <p className={'customText'} style={{paddingLeft: '10px'}}>最近播放</p>
            </div>
            <div className={chooseItem === 0 ? 'selectContainer' : 'unselectContainer'} onClick={() => {
                const url = Store.get('url')
                if (url.indexOf("localhost") > 0) {
                    onChooseItem(0)
                } else {
                    Bus.emit("onNotification", "正在使用HTTP播放歌曲，无法传输，请重新选择曲库")
                }
            }}>
                <img className={'customPic'} src={Images.ICON_FUNC_WIFI}/>
                <p className={'customText'} style={{paddingLeft: '10px'}}>传输</p>
            </div>

            <div style={{marginTop: '30px'}}/>
            <div className={'addMenuContainer'}>
                <div className={'selectContainer'} style={{margin: 0, background: 'transparent'}}>
                    <p className={'customTitleText'}>创建的歌单</p>
                </div>
                <img
                    className={'addMenu'}
                    src={addMenuPic}
                    onClick={() => {
                        if (menuList && menuList.length >= 100) {
                            Bus.emit('onNotification', '您不能再创建更多的歌单了')
                        } else setNameMenuDialogShow(true)
                    }}
                    onMouseOver={() => setAddMenuPic(Images.ICON_MENU_ADD_SELECT)}
                    onMouseOut={() => setAddMenuPic(Images.ICON_MENU_ADD_UNSELECT)}
                />
            </div>
            {renderMenuList()}
            {renderRightClick()}
            <TextDialog
                isShow={nameMenuDialogShow}
                hint={'请输入歌单名'}
                result={onAddMenu}
                close={() => setNameMenuDialogShow(false)}
            />
            <CustomDialog
                isShow={confirmDialogShow}
                hint={'确认删除歌单？'}
                result={onDelMenu}
                close={() => setConfirmDialogShow(false)}
            />
        </div>
    )
}
