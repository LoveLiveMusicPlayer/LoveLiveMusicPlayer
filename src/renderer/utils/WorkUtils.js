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
import {parse as parseLrc} from "clrc";
import {SongMenuHelper} from "../dao/SongMenuHelper";
import {LoveHelper} from "../dao/LoveHelper";
import * as _ from 'lodash'
import {Const} from "../public/Const";
import Logger from './Logger';
import {DBHelper} from "../dao/DBHelper";

const {promisify} = require('util');
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

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
     * @param rootDir 要去掉的目录前面的字符串
     * @returns {Promise<void>}
     *
     * 比如：path: /Users/xxx/Desktop/LoveLive/...
     *      rootDir: /Users/xxx/Desktop/
     *      fileList[0]: LoveLive/...
     */
    async exportToExcel(rootDir) {
        const mPath = rootDir + path.sep + "LoveLive" + path.sep;
        const filesList = [];
        await AppUtils.readFileList(mPath, filesList, rootDir)
        const infoList = await AppUtils.parseMusicInfo(filesList, rootDir)

        const arr = []
        if (infoList) {
            for (let i = 0; i < infoList.length; i++) {
                const music = infoList[i]
                const baseUrl = music.pic.split("Cover")[0]
                const coverName = music.pic.replace(baseUrl, "")
                const fileName = music.path.replace(baseUrl, "")
                const obj = [
                    i + 1,
                    music.title,
                    music.album,
                    music.artist,
                    music.date,
                    fileName,
                    coverName,
                    music.time,
                    baseUrl.replace("/LoveLive/", "LoveLive/")
                ]
                arr.push(obj)
            }
            EXCEL.outPut({
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

    async fetchLatestVersionHint() {
        let result = null
        try {
            const response = await Network.get(VersionUtils.getVersionHintUrl())
            result = response.data
        } catch (error) {
            console.error(error);
        }
        return result
    },

    // 获取数据更新的地址
    async requestUrl(url) {
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
                    const baseUrl = item.value["base_url"]
                    const lyricPath = baseUrl + item.value["music_path"].replace("flac", "lrc")
                    audioList.push({
                        _id: item.value._id,
                        name: item.value.name,
                        singer: item.value.artist,
                        album: item.value.album,
                        lyric: "JP/" + lyricPath,
                        trans: "ZH/" + lyricPath,
                        roma: "ROMA/" + lyricPath,
                        cover: AppUtils.encodeURL(URL + baseUrl + item.value["cover_path"]),
                        musicSrc: AppUtils.encodeURL(URL + baseUrl + item.value["music_path"]),
                    })
                } else {
                    isLoaded = false
                }
            })
            if (isLoaded) {
                Bus.emit("onChangeAudioList", {
                    audioList: audioList,
                    playIndex: playIndex
                })
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
            const mode = Store.get('playMode') || 'orderLoop'
            const playIndex = mode == "shufflePlay" ? Math.floor(Math.random() * promiseArr.length) : 0
            this.putArrToPlayer(promiseArr, playIndex)
        })
    },

    // 根据专辑的 id 播放
    playAlbumByAlbumId(group, albumId, playIndex) {
        AlbumHelper.findOneAlbumByAlbumId(group, albumId).then(res => {
            const promiseArr = []
            res.music.map(id => {
                promiseArr.push(MusicHelper.findOneMusic(id, res.group))
            })
            const mode = Store.get('playMode') || 'orderLoop'
            const playIndex = mode == "shufflePlay" ? Math.floor(Math.random() * promiseArr.length) : 0
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
            const mode = Store.get('playMode') || 'orderLoop'
            const playIndex = mode == "shufflePlay" ? Math.floor(Math.random() * promiseArr.length) : 0
            this.putArrToPlayer(promiseArr, playIndex)
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
            const mode = Store.get('playMode') || 'orderLoop'
            const playIndex = mode == "shufflePlay" ? Math.floor(Math.random() * promiseArr.length) : 0
            this.putArrToPlayer(promiseArr, playIndex)
        })
    },

    // 播放歌单歌曲
    playMenuByMusicUids(jsonArr, playIndex) {
        const promiseArr = []
        jsonArr.map(item => {
            promiseArr.push(MusicHelper.findOneMusicByUniqueId(item._id))
        })
        if (promiseArr.length > 0) {
            this.putArrToPlayer(promiseArr, playIndex)
        } else return Error('歌单内没有歌曲')
    },

    // 下载数据更新
    async updateJsonData(appVersion, onPrepare, onStart, onProgress, onAlbumEnd, onMusicEnd, onError) {
        onPrepare && onPrepare()
        const data = await this.requestUrl(VersionUtils.getDataUrl())
        if (data == null) {
            onError && onError()
            AppUtils.openMsgDialog("error", "获取更新数据失败，请稍候再试")
            return
        }
        const version = Store.get("dataVersion")
        Logger(`云端数据版本号：${data.version} 本地数据版本号：${version}`)
        if (version && version >= data.version) {
            onError && onError()
            AppUtils.openMsgDialog("info", "已是最新数据，无需更新")
            return
        }
        if (data.version === 101) {
            await DBHelper.update101DBStep1()
            await this.updateJsonDataStart(data, onStart, onProgress, onAlbumEnd, onMusicEnd)
            await DBHelper.update101DBStep2()
        } else {
            await this.updateJsonDataStart(data, onStart, onProgress, onAlbumEnd, onMusicEnd)
        }
        Store.set("dataVersion", data.version)
    },

    async updateJsonDataStart(data, onStart, onProgress, onAlbumEnd, onMusicEnd) {
        onStart && onStart()
        await AlbumHelper.removeAllAlbum()
        await AlbumHelper.insertOrUpdateAlbum(JSON.stringify(data.album), function (progress) {
            onProgress && onProgress(progress)
        })
        onAlbumEnd && onAlbumEnd(data)
        await MusicHelper.removeAllMusic()
        await MusicHelper.insertOrUpdateMusic(JSON.stringify(data.music), function (progress) {
            onProgress && onProgress(progress)
        })
        onMusicEnd && onMusicEnd()
    },

    parseGroupName(name) {
        if (name === Const.saki.key) {
            return Const.saki.value
        } else if (name === Const.yohane.key) {
            return Const.yohane.value
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

    // 获取当前播放的索引
    threeLyricIndex(lyricList, currentMillisecond) {
        let index = 0;
        for (const {length} = lyricList; index <= length; index += 1) {
            const lyric = lyricList[index];
            if (!lyric || lyric.startMillisecond > currentMillisecond) {
                break;
            }
        }

        index = index - 1;

        if (lyricList.length - 1 === index) {
            return {prev: index - 1, current: index, next: 0}
        }
        if (index === 0) {
            return {prev: 0, current: 0, next: 1}
        }
        return {prev: index - 1, current: index, next: index + 1};
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
    async findMySongList(menuId, setInfo, setTableData) {
        const info = await SongMenuHelper.findMenuById(menuId)
        setInfo && setInfo(info)
        const musicList = []
        const loveList = await LoveHelper.findAllLove()
        for (let index = 0; index < info.music.length; index++) {
            const item = info.music[index]
            let isLove = false
            loveList && loveList.map(love => {
                if (item._id === love._id) {
                    isLove = true
                }
            })
            const music = await MusicHelper.findOneMusicByUniqueId(item._id)
            musicList.push({
                key: index,
                song: music.name,
                artist: music.artist,
                time: music.time,
                music: music
            })
        }
        setTableData && setTableData(musicList)
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
            music.isLove = isLove
            tableData.push({
                key: index,
                song: music.name,
                artist: music.artist,
                time: music.time,
                music: music
            })
        })
        setTableData && setTableData(tableData)
    },

    // 获取 我喜欢 歌曲列表
    async findLoveList(setTableData) {
        const loveList = await LoveHelper.findAllLove()
        const tableData = []
        for (let index = 0; index < loveList.length; index++) {
            const love = loveList[index]
            const music = await MusicHelper.findOneMusicByUniqueId(love._id)
            if (music) {
                music.isLove = true
                tableData.push({
                    key: index,
                    song: music.name,
                    artist: music.artist,
                    time: music.time,
                    music: music
                })
            }
        }
        setTableData && setTableData(tableData)
    },

    // 获取 最近播放 歌曲列表
    async findHistoryList(setTableData) {
        const musicList = await MusicHelper.findAllMusicRecentlyByLimit()
        const loveList = await LoveHelper.findAllLove()
        const tableData = []
        musicList.map((music, index) => {
            let isLove = false
            loveList && loveList.map(item => {
                if (music._id === item._id) {
                    isLove = true
                }
            })
            music.isLove = isLove
            tableData.push({
                key: index,
                song: music.name,
                artist: music.artist,
                time: music.time,
                music: music
            })
        })
        setTableData && setTableData(tableData)
    },

    // 计算播放的真实次数和对应的时长
    calcTrulyPlayInfo(originMap) {
        // 播放次数
        let count
        // 播放时长
        let during = 0
        // 完整的map
        const mapList = []
        // 过滤掉0的map
        const map_no_zero = []
        originMap.forEach((value, key) => {
            mapList.push({
                time: key,
                count: value
            })
            if (value > 0) {
                map_no_zero.push({
                    time: key,
                    count: value
                })
            }
        })

        // 将过滤掉0的map根据 count 字段进行数量统计生成计算后的对象
        // value: 记录的播放数; count: 在全部歌词中统计到播放数的总数
        const calcObj = _.countBy(map_no_zero, 'count')
        let obj = []
        for (let key in calcObj) {
            if (calcObj.hasOwnProperty(key)) {
                obj.push({
                    value: key,
                    count: calcObj[key]
                })
            }
        }

        if (obj.length > 0) {
            // 过滤不满足播放全部歌词1/3的kv
            obj = _.filter(obj, function (o) {
                return o.count > Math.floor(mapList.length / 3)
            })
            // 对满足要求的kv进行记录播放数的降序排序，首位即是出现频率最高的播放数
            obj = _.orderBy(obj, 'value', 'desc')

            if (obj.length > 0) {
                // 取首位的记录的播放数
                count = Number(obj[0].value)

                // 将完整的map进行遍历，在前置设置虚拟节点0，并且不取map的最后一位
                for (let i = 0; i < mapList.length - 2; i++) {
                    const currentCount = Number(mapList[i].count)
                    const currentTime = Number(mapList[i].time)
                    // 得到的要进行计算的次数
                    const calcCount = currentCount > count ? count : currentCount

                    if (i === 0) {
                        // 第一帧步长直接取 mapList[0].time - 0 即 ${currentTime}
                        // 时长则是 步长 * 播放次数
                        during += currentTime * calcCount
                    } else {
                        // 后续帧步长则取 后一帧的起始时间戳 - 当前帧的起始时间戳
                        // 时长则是 步长 * 播放次数
                        during += (Number(mapList[i + 1].time) - currentTime) * calcCount
                    }
                }

                return {count, during}
            }
        }

        return null
    },

    /**
     * 判断全选checkbox状态
     * @param data
     * @returns -1: 一个都没选 0: 选了但不完全 1: 全部都选择
     */
    checkBoxStatus(data) {
        // 循环检查次数
        let cycleNum = 0
        // 已选中的个数
        let checkNum = 0
        data.forEach(album => {
            album.music.forEach(music => {
                cycleNum++
                if (music.choose) {
                    checkNum++
                }
            })
        })
        if (checkNum === 0) {
            return -1
        } else if (cycleNum === checkNum) {
            return 1
        } else return 0
    },

    // 将 set 集合打印成 str
    arrToString(set) {
        let str = ''
        const arr = Array.from(set)
        arr.map((item, index) => {
            if (index !== arr.length - 1) {
                str += this.parseGroupName(item)
                str += '、'
            } else str += this.parseGroupName(item)
        })
        return AppUtils.isEmpty(str) ? '-' : str
    },

    calcSizeSync(dirPath, cb) {
        let fileSize = 0
        let error = null

        function calc(dirPath, cb1) {
            const statObj = fs.statSync(dirPath)
            if (statObj.isDirectory()) {
                try {
                    const files = fs.readdirSync(dirPath)
                    let dirs = files.map(item => {
                        return path.join(dirPath, item)
                    })
                    let index = 0

                    function next() {
                        if (index < dirs.length) return cb1 && cb1()
                        let current = dirs[index++]
                        calc(current, next)
                    }

                    next()
                } catch (err) {
                    error = err
                }

            } else {
                fileSize += statObj.size
                cb1 && cb1()
            }
        }

        calc(dirPath)
        cb(error, fileSize)
    },

    async calcSize(dirPath, cb) {
        let fileSize = 0;
        let error = null

        async function calc(dirPath) {
            try {
                const statObj = await stat(dirPath)
                if (statObj.isDirectory()) {
                    const files = await readdir(dirPath)
                    let dirs = files.map(item => {
                        return path.join(dirPath, item)
                    })
                    let index = 0

                    async function next() {
                        if (index < dirs.length) {
                            let current = dirs[index++]
                            await calc(current)
                            await next()
                        }
                    }

                    return await next()
                } else {
                    fileSize += statObj.size
                }
            } catch (err) {
                error = err
            }
        }

        await calc(dirPath)
        cb(error, fileSize)
    }
}
