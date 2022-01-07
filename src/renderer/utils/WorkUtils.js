import {AppUtils} from "./AppUtils";
import EXCEL from "js-export-xlsx";
import * as mm from "music-metadata";
import fs from "fs";
import Network from "./Network";
import {AlbumHelper} from "../dao/AlbumHelper";
import Bus from "./Event";
import {MusicHelper} from "../dao/MusicHelper";
import Store from "./Store";
import {VersionUtils} from "./VersionUtils";
import {INIT_CHECK_FILE, REQUEST_LATEST_VERSION_URL} from "./URLHelper";
import {parse as parseLrc} from "clrc";
import {SongMenuHelper} from "../dao/SongMenuHelper";
import {LoveHelper} from "../dao/LoveHelper";

const path = require('path');

export const WorkUtils = {
    /**
     * 导出对象列表为文本
     * @param arr
     */
    exportToTxt(arr) {
        let dataTable = []
        if (arr) {
            for (let i = 0; i < arr.length; i++) {
                let obj = {
                    id: i + "",
                    title: arr[i].title,
                    album: arr[i].album,
                    artist: arr[i].artist,
                    date: arr[i].date,
                    type: arr[i].type,
                    path: arr[i].path,
                    pic: arr[i].pic
                }
                dataTable.push(obj)
            }
        }
        const json = JSON.stringify(dataTable)
        AppUtils.downloadTxtFile(json, "music")
    },

    /**
     * 递归导出目录中全部歌曲的音乐信息为Excel
     * @param path 音乐文件夹根目录
     * @param rootDir 要去掉的目录前面的字符串
     * @returns {Promise<void>}
     *
     * 比如：path: /Users/xxx/Desktop/LoveLive/...
     *      rootDir: /Users/xxx/Desktop/
     *      fileList[0]: LoveLive/...
     */
    async exportToExcel(path, rootDir) {
        const filesList = [];
        await AppUtils.readFileList(path, filesList, rootDir)
        const infoList = await AppUtils.parseMusicInfo(filesList, rootDir)

        const arr = []
        if (infoList) {
            for (let i = 0; i < infoList.length; i++) {
                const music = infoList[i]
                const obj = [i + 1, music.title, music.album, music.artist, music.date, music.path, music.pic, music.lyric, music.time, music.trans, music.roma]
                arr.push(obj)
            }
            EXCEL.outPut({
                header: ['id', '歌曲名称', '专辑名称', '艺术家', '发售日期', '文件路径', '封面路径', '日文歌词', '时长', '中文歌词', '罗马歌词'],
                data: arr,
                name: 'music'
            });
        }
    },

    /**
     * 读取音乐ID3信息
     * @param filePath 音乐文件路径
     */
    readMusicInfo(filePath) {
        mm.parseFile(filePath).then(res => {
            const dir = filePath.substring(0, filePath.lastIndexOf(path.sep) + 1)
            const des = dir + `Cover_1.jpg`
            fs.writeFileSync(des, res.common.picture[0].data)
        })
    },

    // 获取歌词
    async requestLyric(url) {
        let result = ""
        try {
            const response = await Network.get(url)
            result = response.data
        } catch (error) {
            return new Promise((resolve, reject) => {
                reject()
            })
        }
        return result
    },

    // 获取该版本是否需要强制恢复初始状态
    async requestNeedInit(version) {
        let result = 0
        try {
            const response = await Network.get(INIT_CHECK_FILE)
            response.data.map(item => {
                if (item.version === version) {
                    result = item.status
                }
            })
        } catch (error) {
            return new Promise((resolve, reject) => {
                reject()
            })
        }
        return result
    },

    async fetchLatestVersionHint() {
        let result = null
        try {
            const response = await Network.get(REQUEST_LATEST_VERSION_URL)
            result = response.data
        } catch (error) {
            console.error(error);
        }
        return result
    },

    // 获取数据更新的地址
    async requestUrl() {
        let result = null
        try {
            const response = await Network.get(VersionUtils.refreshDataUrl())
            result = response.data.data
        } catch (error) {
            console.error(error);
        }
        return result
    },

    // 获取更新数据信息
    async requestData(url) {
        let result = null
        try {
            const response = await Network.get(url)
            result = response.data
        } catch (error) {
            console.error(error);
        }
        return result
    },

    async changeAlbumByGroup(group) {
        // 切换企划时从数据库加载对应的全部专辑
        const URL = Store.get("url")
        const albums = await AlbumHelper.findAllAlbumsByGroup(group)
        const topList = []
        const bottomList = []
        albums?.map((item, index) => {
            const album = []
            if (index % 2 === 0) {
                item["cover_path"].map(src => {
                    album.push({
                        id: item._id,
                        src: URL + src,
                        text: item.name
                    })
                })
                topList.push(album)
            } else {
                item["cover_path"].map(src => {
                    album.push({
                        id: item._id,
                        src: URL + src,
                        text: item.name
                    })
                })
                bottomList.push(album)
            }
        })
        return {
            top: topList,
            bottom: bottomList
        }
    },

    // 将歌曲列表传给播放器
    putArrToPlayer(promiseArr, playIndex) {
        let isLoaded = true
        const URL = Store.get("url")
        Promise.allSettled(promiseArr).then(res => {
            const audioList = []
            res.map(item => {
                if (item.value != null) {
                    audioList.push({
                        _id: item.value._id,
                        name: item.value.name,
                        singer: item.value.artist,
                        album: item.value.album,
                        lyric: item.value.lyric,
                        trans: item.value.trans,
                        roma: item.value.roma,
                        playIndex: playIndex ? playIndex : 0,
                        cover: AppUtils.encodeURL(URL + item.value["cover_path"]),
                        musicSrc: AppUtils.encodeURL(URL + item.value["music_path"]),
                    })
                } else {
                    isLoaded = false
                }
            })
            if (isLoaded) {
                Bus.emit("onChangeAudioList", audioList)
            } else {
                AppUtils.openMsgDialog("error", "存在损坏的数据，请重新更新数据")
            }
        })
    },

    // 根据专辑的唯一 id 播放
    playAlbumByUniqueId(_id) {
        AlbumHelper.findOneAlbumByUniqueId(_id).then(res => {
            const promiseArr = []
            res.music.map(id => {
                promiseArr.push(MusicHelper.findOneMusic(id, res.group))
            })
            this.putArrToPlayer(promiseArr)
        })
    },

    // 根据专辑的 id 播放
    playAlbumByAlbumId(group, albumId, playIndex) {
        AlbumHelper.findOneAlbumByAlbumId(group, albumId).then(res => {
            const promiseArr = []
            res.music.map(id => {
                promiseArr.push(MusicHelper.findOneMusic(id, res.group))
            })
            this.putArrToPlayer(promiseArr, playIndex)
        })
    },

    // 播放团组内所有歌曲
    playAlbumsByGroup(group) {
        AlbumHelper.findAllAlbumsByGroup(group).then(albumList => {
            const promiseArr = []
            albumList.map(item => {
                item.music.map(id => {
                    promiseArr.push(MusicHelper.findOneMusic(id, item.group))
                })
            })
            this.putArrToPlayer(promiseArr)
        })
    },

    // 播放所有歌曲
    playAllAlbums() {
        AlbumHelper.findAllAlbums().then(albumList => {
            const promiseArr = []
            albumList.map(item => {
                item.music.map(id => {
                    promiseArr.push(MusicHelper.findOneMusic(id, item.group))
                })
            })
            this.putArrToPlayer(promiseArr)
        })
    },

    // 播放歌单歌曲
    playMenuByMusicIds(jsonArr, playIndex) {
        const promiseArr = []
        jsonArr.map(item => {
            promiseArr.push(MusicHelper.findOneMusic(item.id, item.group))
        })
        if (promiseArr.length > 0) {
            this.putArrToPlayer(promiseArr, playIndex)
        } else return Error('歌单内没有歌曲')
    },

    // 下载数据更新
    async updateJsonData(onStart, onProgress, onAlbumEnd, onMusicEnd) {
        const dataUrl = await this.requestUrl()
        if (dataUrl == null) {
            AppUtils.openMsgDialog("error", "服务繁忙，请稍候再试")
            return
        }
        const data = await this.requestData(dataUrl)
        if (data == null) {
            AppUtils.openMsgDialog("error", "服务繁忙，请稍候再试")
            return
        }
        const version = Store.get("dataVersion")
        if (version && version >= data.version) {
            AppUtils.openMsgDialog("info", "已是最新数据，无需更新")
            return
        }
        onStart && onStart()
        await AlbumHelper.insertOrUpdateAlbum(JSON.stringify(data.album), function (progress) {
            onProgress && onProgress(progress)
        })
        onAlbumEnd && onAlbumEnd(data)
        await MusicHelper.insertOrUpdateMusic(JSON.stringify(data.music), function (progress) {
            onProgress && onProgress(progress)
        })
        Store.set("dataVersion", data.version)
        onMusicEnd && onMusicEnd()
    },

    parseGroupName(name) {
        if (name === 'Nijigasaki') {
            return '虹咲学园'
        } else return name
    },

    /**
     * 计算右键弹窗 Y 轴坐标
     * @param event
     * @param number 弹窗内功能按键数
     * @returns {number}
     */
    calcRightClickPosition(event, number) {
        const dialogHeight = 40 * number
        const faceHeight = document.body.clientHeight - 160
        const innerFaceHeight = event.pageY - dialogHeight
        let pageY = event.pageY
        if (faceHeight - innerFaceHeight < dialogHeight + 88) {
            pageY = pageY - dialogHeight
        }
        return pageY
    },

    // 获取当前播放的索引
    currentLyricIndex(lyricList, currentMillisecond) {
        let index = 0;
        for (const {length} = lyricList; index <= length; index += 1) {
            const lyric = lyricList[index];
            if (!lyric || lyric.startMillisecond > currentMillisecond) {
                break;
            }
        }
        return index - 1;
    },

    // 将中日罗马三种歌词解析并获取当前要播放的三种形式的歌词行
    parseTickLrc(currentLrcStatus, info, jpList, jpIndex) {
        let zhIndex = 0
        let romaIndex = 0
        let prevLrc = null
        let nextLrc = null
        let singleLrc = null
        switch (currentLrcStatus) {
            case 'jp':
                if (jpIndex !== -1 && jpList && jpIndex < jpList.lyrics.length) {
                    if (jpIndex % 2 === 0) {
                        prevLrc = jpList.lyrics[jpIndex].content
                        if (jpList.lyrics.length > jpIndex + 1) {
                            nextLrc = jpList.lyrics[jpIndex + 1].content
                        }
                    } else {
                        prevLrc = jpList.lyrics[jpIndex - 1].content
                        nextLrc = jpList.lyrics[jpIndex].content
                    }
                    singleLrc = jpList.lyrics[jpIndex].content
                }
                break
            case 'zh':
                let zhList = null
                if (info.zhLrc) {
                    zhList = parseLrc(info.zhLrc)
                    zhIndex = WorkUtils.currentLyricIndex(zhList.lyrics, info.currentTime)
                }
                if (jpIndex !== -1 && jpList && jpIndex < jpList.lyrics.length) {
                    prevLrc = jpList.lyrics[jpIndex].content
                    singleLrc = jpList.lyrics[jpIndex].content
                }
                if (zhIndex !== -1 && zhList && zhIndex < zhList.lyrics.length) {
                    nextLrc = zhList.lyrics[zhIndex].content
                }
                break
            case 'roma':
                let romaList = null
                if (info.romaLrc) {
                    romaList = parseLrc(info.romaLrc)
                    romaIndex = WorkUtils.currentLyricIndex(romaList.lyrics, info.currentTime)
                }
                if (jpIndex !== -1 && jpList && jpIndex < jpList.lyrics.length) {
                    prevLrc = jpList.lyrics[jpIndex].content
                    singleLrc = jpList.lyrics[jpIndex].content
                }
                if (romaIndex !== -1 && romaList && romaIndex < romaList.lyrics.length) {
                    nextLrc = romaList.lyrics[romaIndex].content
                }
                break
            default:
                break
        }
        return {prevLrc: prevLrc, nextLrc: nextLrc, singleLrc: singleLrc}
    },

    // 获取 歌单id 的 歌曲列表
    async findMySongList(menuId, setInfo, setTableData, setGroup, setCategory) {
        const info = await SongMenuHelper.findMenuById(menuId)
        setInfo && setInfo(info)
        const music = []
        const albumList = []
        const loveList = await LoveHelper.findAllLove()
        info.music.map((item, index) => {
            let isLove = false
            loveList && loveList.map(love => {
                if (item._id === love._id) {
                    isLove = true
                }
            })
            albumList.push(AlbumHelper.findOneAlbumByAlbumId(item.group, item.album))
            music.push({
                key: index,
                song: item.name,
                artist: item.artist,
                time: item.time,
                isLove: isLove,
                music: item
            })
        })
        setTableData && setTableData(music)
        const categoryList = new Set()
        const groupList = new Set()
        Promise.allSettled(albumList).then(res => {
            if (categoryList.size < 4) {
                res.map(item => {
                    groupList.add(item.value.group)
                    categoryList.add(item.value.category)
                })
            }
            setGroup && setGroup(groupList)
            setCategory && setCategory(categoryList)
        })
    },

    // 获取 专辑id 的 歌曲列表
    async findAlbumList(albumUniqueId, groupId, setInfo, setTableData) {
        const album = await AlbumHelper.findOneAlbumByUniqueId(albumUniqueId)
        setInfo && setInfo(album)
        const musicList = await MusicHelper.findAllMusicByAlbumId(groupId, album.id)
        const tableData = []
        const loveList = await LoveHelper.findAllLove()
        musicList.map((music, index) => {
            let isLove = false
            loveList && loveList.map(item => {
                if (music._id === item._id) {
                    isLove = true
                }
            })
            tableData.push({
                key: index,
                song: music.name,
                artist: music.artist,
                time: music.time,
                isLove: isLove,
                music: music
            })
        })
        setTableData && setTableData(tableData)
    }
}
