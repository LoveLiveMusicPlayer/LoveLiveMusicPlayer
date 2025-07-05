import {AppUtils} from "../utils/AppUtils";
import Store from "../utils/Store"
import {AlbumHelper} from "./AlbumHelper";
import {LoveHelper} from "./LoveHelper";
import {MusicHelper} from "./MusicHelper";
import {SongMenuHelper} from "./SongMenuHelper";
import { LyricHelper } from './LyricHelper';

let oldLoveList = []
let oldMenuList = []

export const DBHelper = {
    // 设置 http-server 信息
    setHttpServer(info) {
        Store.set("serverPath", info.path)
        Store.set("serverPort", info.port)
    },

    // 获取 http-server 信息
    getHttpServer() {
        let info = null
        const path = Store.get("serverPath")
        const port = Store.get("serverPort")
        if (!AppUtils.isEmpty(path) && !AppUtils.isEmpty(port)) {
            info = {path: path, port: port}
        }
        return info
    },

    // 设置背景颜色
    setBGColor(colors) {
        Store.set("colors", colors)
    },

    // 获取背景颜色
    getBGColor() {
        let colors = {color1: '#f9f900', color2: '#ea7500'}
        const tempColors = Store.get("colors")
        if (!AppUtils.isEmpty(tempColors)) {
            colors = JSON.parse(tempColors)
        }
        return colors
    },

    // 删除用户数据
    removeUserDB(version) {
        const dataVersion = Store.get('dataVersion')
        this.clearStore(version)
        Store.set('dataVersion', dataVersion)
    },

    // 删除自建数据
    async removeDIYDB(version) {
        const promiseArr = []
        this.clearStore(version)
        promiseArr.push(LoveHelper.removeAllILove())
        promiseArr.push(SongMenuHelper.removeAllMenu())
        return Promise.allSettled(promiseArr)
    },

    // 删除全部数据
    async removeAllDB(version) {
        const promiseArr = []
        this.clearStore(version)
        promiseArr.push(AlbumHelper.removeAllAlbum())
        promiseArr.push(LoveHelper.removeAllILove())
        promiseArr.push(MusicHelper.removeAllMusic())
        promiseArr.push(SongMenuHelper.removeAllMenu())
        promiseArr.push(LyricHelper.removeAllLyric())
        return Promise.allSettled(promiseArr)
    },

    async update103DBStep1() {
        const loveList = await LoveHelper.findAllLove()
        const menuList = await SongMenuHelper.findAllMenu()
        loveList.forEach(item => {
            oldLoveList.push({
                _id: item._id,
                timestamp: item.timestamp
            })
        })
        menuList.forEach(item => {
            const music = []
            item.music.forEach(m => {
                music.push({
                    _id: m._id
                })
            })
            oldMenuList.push({
                _id: item._id,
                id: item.id,
                date: item.date,
                name: item.name,
                music: music,
            })
        })
        await LoveHelper.removeAllILove()
        await SongMenuHelper.removeAllMenu()
    },

    async update103DBStep2() {
        for (let love of oldLoveList) {
            await LoveHelper.insertSongToLove(love._id, love.timestamp)
        }
        for (let menu of oldMenuList) {
            await SongMenuHelper.insertMenu(menu)
        }
    },

    // 删除音乐数据
    async removeMusicDB(version) {
        const promiseArr = []
        this.clearStore(version)
        promiseArr.push(AlbumHelper.removeAllAlbum())
        promiseArr.push(MusicHelper.removeAllMusic())
        return Promise.allSettled(promiseArr)
    },

    // 清除 store
    clearStore(appVersion) {
        Store.clear()
        if (!AppUtils.isEmpty(appVersion)) {
            Store.set('forceRemoveVersion' + appVersion, appVersion)
        }
    }
}
