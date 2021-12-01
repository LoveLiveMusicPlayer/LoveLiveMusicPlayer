const db = require('../utils/Database')("iLove")
import Bus from '../utils/Event'

export const LoveHelper = {
    // 加入我喜欢
    async insertSongToLove(music) {
        const loveMusic = await db.findOne({_id: music._id})
        let isHasCurrentMusic = false
        if (loveMusic) {
            isHasCurrentMusic = true
        }
        if (!isHasCurrentMusic) {
            music.timestamp = new Date().getTime()
            return db.insert(music)
        } else return new Promise(_ => {
            Bus.emit('onNotification', '歌曲已经存在')
        })
    },

    // 根据 id 获取
    findLoveById(_id) {
        return db.findOne({_id: _id})
    },

    // 获取全部我喜欢的歌曲
    findAllLove() {
        return db.findAll(null, null, {timestamp: 1})
    },

    // 删除歌曲
    async deleteSong(music) {
        const love = await db.findOne({_id: music._id})
        if (love) {
            return db.remove({_id: music._id})
        } else return new Promise(((resolve, reject) => {
            reject('删除失败')
        }))
    },

    // 删除全部我喜欢
    removeAllILove() {
        return db.remove(null, {multi: true})
    }
}
