import {Button, Checkbox, List} from 'antd';
import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {AlbumHelper} from "../../dao/AlbumHelper";
import Store from "../../utils/Store";
import './index.css'
import {MusicHelper} from "../../dao/MusicHelper";
import {AppUtils} from "../../utils/AppUtils";
import {WorkUtils} from "../../utils/WorkUtils";

const CheckboxGroup = Checkbox.Group;

export const TransferChoose = forwardRef(({btnOk}, ref) => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkAll, setCheckAll] = useState(false)
    const [disableNext, setDisableNext] = useState(true)

    useImperativeHandle(ref, () => ({
        loading: (needLoad) => {
            setLoading(needLoad)
        }
    }))

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
        setIndeterminate(false)
        setCheckAll(e.target.checked)
        setDisableNext(!e.target.checked)
    };

    useEffect(async () => {
        if (loading) {
            return
        }

        setLoading(true)
        try {
            const tempAlbumList = []
            const tempMusicList = []
            const albumList = await AlbumHelper.findAllAlbums()
            for (const album of albumList) {
                tempMusicList.length = 0
                const musicList = await MusicHelper.findAllMusicByAlbumId(album.group, album.id)
                musicList.forEach(music => {
                    if (music.export) {
                        tempMusicList.push(music)
                    }
                })
                if (tempMusicList.length > 0) {
                    album.music = [...tempMusicList]
                    tempAlbumList.push(album)
                }
            }
            setData([...tempAlbumList])
            setLoading(false)
        } catch (e) {
            setLoading(false)
        }
    }, []);

    const renderChildren = (item, index) => {
        const plainOptions = []
        item.music.forEach(music => {
            plainOptions.push({
                label: music.name,
                value: music._id,
                style: {color: 'white'}
            })
        })
        return <CheckboxGroup
            options={plainOptions}
            style={{
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column'
            }}
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
        btnOk(uIdList)
    }

    return (
        <>
            <div id={"albumContainer"}>
                <List
                    loading={loading}
                    dataSource={data}
                    renderItem={(item, index) => {
                        const url = Store.get('url') + item["cover_path"][0]
                        return (
                            <div key={"div" + item._id}
                                 style={{display: 'flex', flexDirection: 'row', paddingTop: 12, paddingBottom: 12}}>
                                <img src={url} style={{width: 150, height: 150, marginTop: 6}}/>
                                <div style={{flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 40}}>
                                    <p style={{fontSize: 20, color: 'white', fontWeight: '500'}}>{item.name}</p>
                                    {renderChildren(item, index)}
                                </div>
                            </div>
                        )
                    }}
                />
            </div>
            {loading === false ?
                <div className={"funcContainer"}>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <Checkbox
                            indeterminate={indeterminate}
                            onChange={onCheckAllChange}
                            checked={checkAll}
                            style={{color: 'white'}}>
                            {checkAll ? "反选" : "全选"}
                        </Checkbox>
                        <Button type="primary" disabled={disableNext} onClick={clickOk}>选好了</Button>
                    </div>
                    <p style={{color: 'white', fontSize: 12}}>请先选择歌曲，点击按钮后进行配对传输</p>
                </div> : null}
        </>
    );
});
