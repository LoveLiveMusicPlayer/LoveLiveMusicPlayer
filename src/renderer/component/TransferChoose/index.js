import {Button, Checkbox, List, Switch} from 'antd';
import React, {useEffect, useState} from 'react';
import {AlbumHelper} from "../../dao/AlbumHelper";
import Store from "../../utils/Store";
import './index.css'
import {MusicHelper} from "../../dao/MusicHelper";
import {AppUtils} from "../../utils/AppUtils";
import {WorkUtils} from "../../utils/WorkUtils";
import * as Images from "../../public/Images";
import {Img} from "../Pagin/styled-components/index";
import {Const} from "../../public/Const";
import fs from "fs";
import {DBHelper} from "../../dao/DBHelper";
import path from "path";

const CheckboxGroup = Checkbox.Group;

export const TransferChoose = ({btnWIFI, changeSwitch, disable, btnUSB}) => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkAll, setCheckAll] = useState(false)
    const [disableNext, setDisableNext] = useState(true)
    const [chooseCount, setChooseCount] = useState(0)

    const onChange = (albumUId, musicUidList) => {
        for (let i = 0; i < data.length; i++) {
            if (data[i]._id === albumUId) {
                for (let j = 0; j < data[i].music.length; j++) {
                    data[i].music[j].choose = AppUtils.isStrInArray(data[i].music[j]._id, musicUidList)
                }
                let status = WorkUtils.checkBoxStatus(data)
                setIndeterminate(status === 0)
                setCheckAll(status === 1);
                setDisableNext(status === -1)
                setData((data) => [...data])
                break;
            }
        }
    };

    const onCheckAllChange = (e) => {
        data.forEach(album => {
            album.music.forEach(music => {
                music.choose = e.target.checked
            })
        })
        setData((data) => [...data])
        setIndeterminate(false)
        setCheckAll(e.target.checked)
        setDisableNext(!e.target.checked)
    };

    useEffect(() => {
        let count = 0
        data.forEach(album => {
            album.music.forEach(music => {
                if (music.choose) {
                    count++
                }
            })
        })
        setChooseCount(count)
    }, [data])

    useEffect(async () => {
        if (loading) {
            return
        }

        setLoading(true)
        // 加载保存的传输列表
        const chooseMusicList = JSON.parse(Store.get('transMusic', '[]'))
        try {
            const tempAlbumList = []
            const tempMusicList = []
            let albumList = []
            albumList = albumList.concat(await AlbumHelper.findAllAlbumsByGroup(Const.us.key))
            albumList = albumList.concat(await AlbumHelper.findAllAlbumsByGroup(Const.aqours.key))
            albumList = albumList.concat(await AlbumHelper.findAllAlbumsByGroup(Const.saki.key))
            albumList = albumList.concat(await AlbumHelper.findAllAlbumsByGroup(Const.liella.key))
            albumList = albumList.concat(await AlbumHelper.findAllAlbumsByGroup(Const.combine.key))
            albumList = albumList.concat(await AlbumHelper.findAllAlbumsByGroup(Const.hasunosora.key))
            for (const album of albumList) {
                tempMusicList.length = 0
                const musicList = await MusicHelper.findAllMusicByAlbumId(album.group, album.id)
                musicList.forEach(music => {
                    const musicPath = DBHelper.getHttpServer().path + path.sep + music["base_url"] + music["music_path"]
                    const isExist = fs.existsSync(musicPath)
                    if (isExist && music.export) {
                        music.choose = AppUtils.isStrInArray(music._id, chooseMusicList)
                        tempMusicList.push(music)
                    }
                })
                if (tempMusicList.length > 0) {
                    album.music = [...tempMusicList]
                    tempAlbumList.push(album)
                }
            }
            let status = WorkUtils.checkBoxStatus(tempAlbumList)
            setIndeterminate(status === 0)
            setCheckAll(status === 1);
            setDisableNext(status === -1)
            setData([...tempAlbumList])
            setLoading(false)
        } catch (e) {
            setLoading(false)
        }
    }, []);

    const renderChildren = (item) => {
        const plainOptions = []
        item.music.forEach(music => {
            plainOptions.push({
                label: music.name,
                value: music._id,
                style: {color: 'white'}
            })
        })
        return (
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <CheckboxGroup
                    className={"checkBoxContainer"}
                    options={plainOptions}
                    disabled={disable}
                    value={() => {
                        const arr = []
                        const albumList = data.filter(it => it._id === item._id)
                        if (albumList.length > 0) {
                            albumList[0].music.forEach(music => {
                                if (music.choose) {
                                    arr.push(music._id)
                                }
                            })
                        }
                        return arr
                    }}
                    onChange={(chooseList) => {
                        const arr = []
                        item.music.forEach(music => {
                            chooseList.forEach(musicUId => {
                                if (musicUId === music._id) {
                                    arr.push(music._id)
                                }
                            })
                        })
                        onChange(item._id, arr)
                    }}/>
            </div>
        )
    }

    const saveChoice = () => {
        const uIdList = []
        data.forEach(album => {
            album.music.forEach(music => {
                if (music.choose) {
                    uIdList.push(music._id)
                }
            })
        })
        // 选好后保存传输列表，以备下次进入时恢复
        Store.set('transMusic', JSON.stringify(uIdList))
        return uIdList
    }

    const clickOk = () => {
        btnWIFI(saveChoice())
    }

    const clickUSB = (platform) => {
        btnUSB(saveChoice(), platform)
    }

    return (
        <>
            <div id={"albumContainer"}>
                <List
                    className={"listView"}
                    loading={loading}
                    dataSource={data}
                    renderItem={(item) => {
                        const firstMusicCoverPath = item["music"][0]["cover_path"]
                        let coverUrl = null
                        for (let i = 0; i < item["cover_path"].length; i++) {
                            if (item["cover_path"][i].indexOf(firstMusicCoverPath) > 0) {
                                coverUrl = Store.get('url') + item["cover_path"][i]
                                break
                            }
                        }
                        return (
                            <div key={"div" + item._id} className={"albumItemContainer"}>
                                <Img
                                    className={"albumCover"}
                                    onClick={() => {
                                        const chooseArr = []
                                        const unChooseArr = []
                                        const albumList = data.filter(it => it._id === item._id)
                                        if (albumList.length > 0) {
                                            albumList[0].music.forEach(music => {
                                                if (music.choose) {
                                                    chooseArr.push(music._id)
                                                } else {
                                                    unChooseArr.push(music._id)
                                                }
                                            })
                                            if (albumList[0].music.length > chooseArr.length) {
                                                onChange(item._id, chooseArr.concat(unChooseArr))
                                            } else {
                                                onChange(item._id, [])
                                            }
                                        }

                                    }}
                                    src={decodeURI(coverUrl)}
                                    onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src = Images.ICON_EMPTY
                                    }}
                                />
                                <div className={"albumChildren"}>
                                    <p className={"albumName"}>{item.name}</p>
                                    {renderChildren(item)}
                                </div>
                            </div>
                        )
                    }}
                />
            </div>
            {loading === false ?
                <div className={"funcContainer"}>
                    <div className={"funcLeftContainer"}>
                        <Checkbox
                            disabled={disable}
                            indeterminate={indeterminate}
                            onChange={onCheckAllChange}
                            checked={checkAll}
                            style={{color: 'white'}}>
                            {checkAll ? "反选" : "全选"}
                        </Checkbox>
                        <p style={{color: 'white'}}>(已选:{chooseCount})</p>
                        <div style={{marginLeft: 12, display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <Switch style={{width: 20}} onChange={changeSwitch}/>
                            <p style={{marginLeft: 8, color: "white"}}>是否覆盖传输？(谨慎选择)</p>
                        </div>

                        <Button type="primary" disabled={disableNext} onClick={clickOk}
                                style={{marginLeft: 12}}>WIFI传输</Button>

                        <Button type="primary" disabled={disableNext} onClick={() => clickUSB("android")}
                                style={{marginLeft: 12}}>仅导出Android歌曲</Button>

                        <Button type="primary" disabled={disableNext} onClick={() => clickUSB("ios")}
                                style={{marginLeft: 12}}>仅导出IOS歌曲</Button>
                    </div>
                </div> : null}
        </>
    );
};
