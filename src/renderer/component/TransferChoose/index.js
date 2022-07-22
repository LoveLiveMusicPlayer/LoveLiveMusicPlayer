import {Button, Checkbox, List, Switch} from 'antd';
import React, {useEffect, useState} from 'react';
import {AlbumHelper} from "../../dao/AlbumHelper";
import Store from "../../utils/Store";
import './index.css'
import {MusicHelper} from "../../dao/MusicHelper";
import {AppUtils} from "../../utils/AppUtils";
import {WorkUtils} from "../../utils/WorkUtils";

const CheckboxGroup = Checkbox.Group;

export const TransferChoose = ({btnOk, changeSwitch, disable, useLocalMusic}) => {
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
            const albumList = await AlbumHelper.findAllAlbums()
            for (const album of albumList) {
                tempMusicList.length = 0
                const musicList = await MusicHelper.findAllMusicByAlbumId(album.group, album.id)
                musicList.forEach(music => {
                    if (music.export) {
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

    const clickOk = () => {
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
        btnOk(uIdList)
    }

    return (
        <>
            <div id={"albumContainer"}>
                <List
                    loading={loading}
                    dataSource={data}
                    renderItem={(item) => {
                        const url = Store.get('url') + item["cover_path"][0]
                        return (
                            <div key={"div" + item._id} className={"albumItemContainer"}>
                                <img className={"albumCover"} src={url}/>
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
                        <Button type="primary" disabled={disableNext} onClick={clickOk}
                                style={{marginLeft: 12}}>选好了</Button>
                        <div style={{marginLeft: 12, display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <Switch style={{width: 20}} onChange={useLocalMusic}/>
                            <p style={{marginLeft: 8, color: "white"}}>使用手机曲包，无传输？</p>
                        </div>
                        <div style={{marginLeft: 12, display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <Switch style={{width: 20}} onChange={changeSwitch}/>
                            <p style={{marginLeft: 8, color: "white"}}>是否覆盖传输？(谨慎选择)</p>
                        </div>
                    </div>
                </div> : null}
        </>
    );
};
