import {AppUtils} from "./AppUtils";
import EXCEL from "js-export-xlsx";
import * as mm from "music-metadata";
import fs from "fs";
import Network from "./Network";
import {AlbumHelper} from "../dao/AlbumHelper";
import Bus from "./Event";
import {MusicHelper} from "../dao/MusicHelper";
import Store from "./Store";

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
                const obj = [i + "", music.title, music.album, music.artist, music.date, music.path, music.pic]
                arr.push(obj)
            }
            EXCEL.outPut({
                header: ['id', '歌曲名称', '专辑名称', '艺术家', '发售日期', '文件路径', '封面路径'],
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

    async requestUrl() {
        let result = null
        try {
            const response = await Network.get('https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/info.json')
            result = response.data.data
        } catch (error) {
            console.error(error);
        }
        return result
    },

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

    async changeAlbumByGroup(group, URL) {
        // 切换企划时从数据库加载对应的全部专辑
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

    putArrToPlayer(promiseArr, URL) {
        let isLoaded = true
        Promise.allSettled(promiseArr).then(res => {
            const audioList = []
            res.map(item => {
                if (item.value != null) {
                    audioList.push({
                        _id: item.value._id,
                        name: item.value.name,
                        singer: item.value.artist,
                        album: item.value.album,
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

    findOneAlbumById(id, URL) {
        AlbumHelper.findOneAlbumById(id).then(res => {
            const promiseArr = []
            res.music.map(id => {
                promiseArr.push(MusicHelper.findOneMusic(id, res.group))
            })
            this.putArrToPlayer(promiseArr, URL)
        })
    },

    playAlbumsByGroup(group, URL) {
        AlbumHelper.findAllAlbumsByGroup(group).then(albumList => {
            const promiseArr = []
            albumList.map(item => {
                item.music.map(id => {
                    promiseArr.push(MusicHelper.findOneMusic(id, item.group))
                })
            })
            this.putArrToPlayer(promiseArr, URL)
        })
    },

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
        onStart()
        await AlbumHelper.insertOrUpdateAlbum(JSON.stringify(data.album), function (progress) {
            onProgress(progress)
        })
        onAlbumEnd(data)
        await MusicHelper.insertOrUpdateMusic(JSON.stringify(data.music), function (progress) {
            onProgress(progress)
        })
        Store.set("dataVersion", data.version)
        onMusicEnd()
    }
}
