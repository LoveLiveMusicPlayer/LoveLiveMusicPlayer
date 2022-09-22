import React, {useRef, useState} from "react";
import {connect} from "react-redux";
import {WS_Data} from "../../../utils/WsData";
import {QRDialog} from "../../../component/QRDialog";
import './index.css'
import {Button} from "antd";
import Bus from '../../../utils/Event'
import {Loading} from "../../../component/Loading";
import {LoveHelper} from "../../../dao/LoveHelper";
import {MusicHelper} from "../../../dao/MusicHelper";
import {SongMenuHelper} from "../../../dao/SongMenuHelper";

const TransferData = () => {
    const [qrShow, setQrShow] = useState(false)
    const [scanSuccess, setScanSuccess] = useState(false)
    const wsRef = useRef(null)
    const loadingRef = useRef(null)

    async function phone2pc(loveList, menuList) {
        setQrShow(false)
        loadingRef.current?.setProgress(-1)
        loadingRef.current?.show("导入中..")
        await replaceMenuList(menuList)
        await mergeLoveList("phone2pc", loveList, [])
    }

    async function pc2phone(loveList) {
        setQrShow(false)
        loadingRef.current?.setProgress(-1)
        loadingRef.current?.show("导入中..")
        const menuList = await SongMenuHelper.findPcMenu()
        const tempList = [];
        for (const menu of menuList) {
            const musicId = [];
            for (const music of menu.music) {
                const mMusic = await MusicHelper.findOneMusicByUniqueId(music._id);
                if (mMusic.export) {
                    musicId.push(music._id)
                }
            }
            if (musicId.length !== 0) {
                tempList.push({
                    menuId: menu.id,
                    name: menu.name,
                    musicList: musicId,
                    date: menu.date
                })
            }
        }
        await mergeLoveList("pc2phone", loveList, tempList)
    }

    function concat(arr1, arr2) {
        const arr = arr1.concat();
        for (let i = 0; i < arr2.length; i++) {
            arr.indexOf(arr2[i]) === -1 ? arr.push(arr2[i]) : 0;
        }
        return arr;
    }

    async function mergeLoveList(cmd, loveList, menuList) {
        const allLoveList = await LoveHelper.findAllLove()
        const localList = []
        allLoveList.forEach((music) => localList.push(music._id))
        const finalList = concat(loveList, localList)
        await LoveHelper.removeAllILove();
        for (const id of finalList) {
            const music = await MusicHelper.findOneMusicByUniqueId(id)
            await LoveHelper.insertSongToLove(music)
        }
        const message = {
            cmd: cmd,
            body: generateJson(finalList, menuList)
        }
        wsRef.current?.send(JSON.stringify(message))
        Bus.emit('onMenuDataChanged')
    }

    async function replaceMenuList(menuList) {
        await SongMenuHelper.deletePhoneMenu()
        for (const menu of menuList) {
            const musicList = []
            for (const id of menu["musicList"]) {
                const music = await MusicHelper.findOneMusicByUniqueId(id)
                musicList.push(music)
            }
            await SongMenuHelper.insertPhoneMenu({
                id: menu["menuId"],
                name: menu["name"],
                music: musicList,
                date: menu["date"]
            })
        }
    }

    function generateJson(loveList, menuList) {
        let obj = {}
        obj["love"] = loveList
        obj["menu"] = menuList
        return JSON.stringify(obj)
    }

    return (
        <div className={'transferDataContainer'}>
            <div className={'innerContainer'}>
                <p style={{alignSelf: 'flex-start'}}>数据同步的意义在于同步我喜欢和歌单</p>
                <p style={{alignSelf: 'flex-start'}}>我喜欢：手机和电脑端相互共存，会融合双端数据</p>
                <p style={{alignSelf: 'flex-start'}}>歌单：手机和电脑端相互独立，导入端原有数据将被清空再保存导出端最新的数据</p>
                <Button className={'btnTrans'} type="primary" onClick={() => setQrShow(true)}>我已知晓，开始传输</Button>
            </div>
            <QRDialog isShow={qrShow} close={() => setQrShow(false)} isSuccess={scanSuccess} type={"data"}/>
            <Loading ref={loadingRef}/>
            <WS_Data
                ref={wsRef}
                connected={() => setScanSuccess(true)}
                phone2pc={phone2pc}
                pc2phone={pc2phone}
                finish={() => {
                    loadingRef.current?.hide()
                }}
                stop={() => {
                    loadingRef.current?.hide()
                }}
            />
        </div>
    )
}

function select(store) {
    return {};
}

export default connect(select)(TransferData);