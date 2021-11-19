import React, {useEffect, useState} from 'react';
import './index.css'
import * as Images from '../../public/Images'
import {SongMenuHelper} from "../../dao/SongMenuHelper";
import {TextDialog} from "../TextDialog";

export const SongMenu = ({chooseItem, onChooseItem}) => {

    const [addMenuPic, setAddMenuPic] = useState(Images.ICON_MENU_ADD_UNSELECT)
    const [menuList, setMenuList] = useState([])
    const [nameMenuDialogShow, setNameMenuDialogShow] = useState(false)
    const [refreshMenu, setRefreshMenu] = useState()

    useEffect(() => {
        SongMenuHelper.findAllMenu().then(res => {
            setMenuList(res)
        })
    }, [refreshMenu])

    const renderMenuList = () => {
        const container = []
        menuList.map((item, index) => {
            container.push(
                <div className={chooseItem === index + 1 ? 'selectContainer' : 'unselectContainer'}
                     onClick={() => onChooseItem(index + 1)}>
                    <text className={'customText'}>{item.name}</text>
                </div>
            )
        })
        return container
    }

    const onAddMenu = (text) => {
        SongMenuHelper.insertMenu({
            name: text,
            music: []
        }).then(_ => {
            setRefreshMenu(new Date().getTime())
        })
        // SongMenuHelper.deleteAllMenu()
    }

    return (
        <div className={'songListContainer'}>
            <div className={'selectContainer'} style={{margin: 0, background: 'transparent'}}>
                <text className={'customTitleText'}>我的音乐</text>
            </div>
            <div className={chooseItem === -2 ? 'selectContainer' : 'unselectContainer'}
                 onClick={() => onChooseItem(-2)}>
                <img className={'customPic'} src={Images.ICON_FUNC_MUSIC}/>
                <text className={'customText'} style={{paddingLeft: '10px'}}>音乐馆</text>
            </div>
            <div className={chooseItem === -1 ? 'selectContainer' : 'unselectContainer'}
                 onClick={() => onChooseItem(-1)}>
                <img className={'customPic'} src={Images.ICON_FUNC_LOVE}/>
                <text className={'customText'} style={{paddingLeft: '10px'}}>我喜欢</text>
            </div>
            <div className={chooseItem === 0 ? 'selectContainer' : 'unselectContainer'} onClick={() => onChooseItem(0)}>
                <img className={'customPic'} src={Images.ICON_FUNC_HISTORY}/>
                <text className={'customText'} style={{paddingLeft: '10px'}}>最近播放</text>
            </div>

            <div style={{marginTop: '30px'}}/>
            <div className={'addMenuContainer'}>
                <div className={'selectContainer'} style={{margin: 0, background: 'transparent'}}>
                    <text className={'customTitleText'}>创建的歌单</text>
                </div>
                <img
                    className={'addMenu'}
                    src={addMenuPic}
                    onClick={() => setNameMenuDialogShow(true)}
                    onMouseOver={() => setAddMenuPic(Images.ICON_MENU_ADD_SELECT)}
                    onMouseOut={() => setAddMenuPic(Images.ICON_MENU_ADD_UNSELECT)}
                />
            </div>
            {renderMenuList()}
            <TextDialog
                isShow={nameMenuDialogShow}
                hint={'请输入歌单名'}
                result={onAddMenu}
                close={() => setNameMenuDialogShow(false)}
            />
        </div>
    )
}
