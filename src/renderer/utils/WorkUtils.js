import {AppUtils} from "./AppUtils";
import EXCEL from "js-export-xlsx";
import * as mm from "music-metadata";
import fs from "fs";
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
        }).catch(err => {
            console.log(err)
        })
    }
}
