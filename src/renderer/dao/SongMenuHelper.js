import moment from 'moment'

const db = require('../utils/Database')("songMenu")

export const SongMenuHelper = {

    // 创建歌单
    async insertMenu(json) {
        // 获取当前数据库条数
        const arr = await db.findAll()
        json.id = arr.length + 1
        json.date = moment().format('YYYY-MM-DD')
        return db.insert(json)
    },

    findMenuById(id) {
        return db.findOne({id: id})
    },

    findAllMenu() {
        return db.findAll(null, null, {id: 1})
    },

    /**
     * 将音乐信息插入到歌单中
     * @param id    歌单id
     * @param music ui音乐信息
     * @returns {Promise<unknown>}
     */
    async insertSongToMenu(id, music) {
        const menu = await db.findOne({id: id})
        let isHasCurrentMusic = false
        if (menu && menu.length > 0) {
            console.log(menu)
            menu.map(item => {
                if (item.id === music.id && item.group === music.group) {
                    isHasCurrentMusic = true
                }
            })
        }
        if (!isHasCurrentMusic) {
            menu.music.push(music)
        }
        return db.update({id: id}, menu)
    },

    deleteAllMenu() {
        return db.remove(null, {multi: true})
    }
}
