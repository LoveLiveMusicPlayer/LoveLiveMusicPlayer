import {AppUtils} from "../utils/AppUtils";
import Store from "../utils/Store"
import {AlbumHelper} from "./AlbumHelper";
import {LoveHelper} from "./LoveHelper";
import {MusicHelper} from "./MusicHelper";
import {SongMenuHelper} from "./SongMenuHelper";

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
    async removeAllDB() {
        const promiseArr = []
        this.clearStore()
        promiseArr.push(AlbumHelper.removeAllAlbum())
        promiseArr.push(LoveHelper.removeAllILove())
        promiseArr.push(MusicHelper.removeAllMusic())
        promiseArr.push(SongMenuHelper.removeAllMenu())
        return Promise.allSettled(promiseArr)
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
