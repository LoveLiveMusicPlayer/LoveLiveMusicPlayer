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

    async function phone2pc(loveList, menuList, isCover) {
        setQrShow(false)
        setScanSuccess(false)
        loadingRef.current?.setProgress(-1)
        loadingRef.current?.show("导入中..")
        await phone2pcReplaceMenuList(menuList, isCover)
        await mergeLoveList("phone2pc", loveList, menuList, isCover)
    }

    async function pc2phone(loveList, isCover) {
        setQrShow(false)
        setScanSuccess(false)
        loadingRef.current?.setProgress(-1)
        loadingRef.current?.show("导入中..")
        const menuList = await pc2phoneReplaceMenuList(isCover)
        await mergeLoveList("pc2phone", loveList, menuList, isCover)
    }

    async function mergeLoveList(cmd, loveList, menuList, isCover) {
        let finalList
        if (isCover) {
            if (cmd === "phone2pc") {
                finalList = loveList
            } else {
                finalList = await LoveHelper.findAllLove()
            }
        } else {
            const allLoveList = await LoveHelper.findAllLove()
            const localList = []
            allLoveList.forEach((love) => {
                localList.push({
                    musicId: love._id,
                    timestamp: love.timestamp
                })
            })
            finalList = Object.assign(loveList, localList)
        }
        await LoveHelper.removeAllILove();
        for (const item of finalList) {
            const music = await MusicHelper.findOneMusicByUniqueId(item._id || item.musicId)
            if (music === null) {
                continue
            }
            await LoveHelper.insertSongToLove(music)
        }
        const transLoveList = []
        finalList.forEach(love => {
            transLoveList.push({
                "musicId": love._id || love.musicId,
                "timestamp": love.timestamp
            })
        })
        const message = {
            cmd: cmd,
            body: generateJson(transLoveList, menuList, isCover)
        }
        wsRef.current?.send(JSON.stringify(message))
        Bus.emit('onMenuDataChanged')
    }

    async function phone2pcReplaceMenuList(menuList, isCover) {
        if (isCover) {
            await SongMenuHelper.removeAllMenu()
        } else {
            await SongMenuHelper.deletePhoneMenu()
        }
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

    async function pc2phoneReplaceMenuList(isCover) {
        let menuList
        if (isCover) {
            menuList = await SongMenuHelper.findAllMenu()
        } else {
            menuList = await SongMenuHelper.findPcMenu()
        }
        const tempList = []
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
        return tempList
    }

    function generateJson(loveList, menuList, isCover) {
        let obj = {}
        obj["love"] = loveList
        obj["menu"] = menuList
        obj["isCover"] = isCover
        return JSON.stringify(obj)
    }

    return (
        <div className={'transferDataContainer'}>
            <div className={'innerContainer'}>
                <p className={'tvHint'}>重要事项：数据同步的意义在于同步我喜欢和歌单</p>
                <p className={'tvHint'}>我喜欢：手机和电脑端相互共存，会融合双端数据</p>
                <p className={'tvHint'}>歌单：手机和电脑端相互独立，导入端原有数据将被清空再保存导出端最新的数据</p>
                <Button className={'btnTrans'} type="primary" onClick={() => setQrShow(true)}>我已知晓，开始传输</Button>
            </div>
            <QRDialog isShow={qrShow} close={() => {
                const message = {
                    cmd: "back",
                    body: ""
                }
                wsRef.current?.send(JSON.stringify(message))
                setQrShow(false)
                setScanSuccess(false)
            }} isSuccess={scanSuccess} type={"data"}/>
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
