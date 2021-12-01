import moment from 'moment'
import {AppUtils} from "../utils/AppUtils";
import Bus from '../utils/Event'

const db = require('../utils/Database')("songMenu")

export const SongMenuHelper = {

    // 创建歌单
    async insertMenu(json) {
        // 获取当前数据库条数
        const menuList = await db.findAll()
        const arr = []
        menuList.map(item => {
            arr.push(item.id)
        })
        const number = AppUtils.calcSmallAtIntArr(arr)
        if (number !== -1) {
            json.id = number
            json.date = moment().format('YYYY-MM-DD')
            return db.insert(json)
        } else return new Promise()
    },

    // 歌单填满
    pushAll() {
        const arr = []
        for (let i = 1; i <= 100; i++) {
            arr.push(db.insert({
                id: i,
                date: moment().format('YYYY-MM-DD'),
                name: i,
                music: []
            }))
        }
        Promise.allSettled(arr)
    },

    // 根据 id 获取指定歌单
    findMenuById(id) {
        return db.findOne({id: id})
    },

    // 获取全部歌单
    findAllMenu() {
        return db.findAll(null, null, {id: 1})
    },

    /**
     * 将音乐信息插入到歌单中
     * @param menuId 歌单id
     * @param music  ui音乐信息
     * @returns {Promise<unknown>}
     */
    async insertSongToMenu(menuId, music) {
        const menu = await db.findOne({id: menuId})
        let isHasCurrentMusic = false
        if (menu && menu.music.length > 0) {
            menu.music.map(item => {
                if (item.id === music.id && item.group === music.group) {
                    isHasCurrentMusic = true
                }
            })
        }
        if (!isHasCurrentMusic) {
            menu.music.push(music)
            return db.update({id: menuId}, menu)
        } else return new Promise(_ => {
            Bus.emit('onNotification', '歌曲已经存在')
        })
    },

    /**
     * 删除歌单音乐
     * @param menuId 歌单id
     * @param id     要删除的歌曲key
     */
    async deleteSong(menuId, id) {
        const menu = await db.findOne({id: menuId})
        const length = menu.music.length
        if (menu && length > 0 && id < length) {
            menu.music.splice(id, 1)
            return db.update({id: menuId}, menu)
        } else return new Promise(((resolve, reject) => {
            reject('删除失败')
        }))
    },

    // 删除知道 id 的歌单
    deleteMenu(id) {
        return db.remove(id ? {id: id} : null, {multi: true})
    },

    // 删除全部歌单
    removeAllMenu() {
        return db.remove(null, {multi: true})
    }
}
