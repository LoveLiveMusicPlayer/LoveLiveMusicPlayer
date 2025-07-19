const db = require('../utils/Database')("iLove")
import Bus from '../utils/Event'

export const LoveHelper = {
    // 加入我喜欢
    async insertSongToLove(musicUid, timestamp = new Date().getTime()) {
        const loveMusic = await db.findOne({_id: musicUid})
        let isHasCurrentMusic = false
        if (loveMusic) {
            isHasCurrentMusic = true
        }
        if (!isHasCurrentMusic) {
            return db.insert({
                _id: musicUid,
                timestamp: timestamp
            })
        } else return new Promise(function (resolve, reject) {
            Bus.emit('onNotification', '歌曲已经存在')
            reject("添加失败")
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
    async deleteSong(musicUid) {
        const love = await db.findOne({_id: musicUid})
        if (love) {
            return db.remove({_id: musicUid})
        } else return new Promise(function (resolve, reject) {
            reject('删除失败')
        })
    },

    // 删除全部我喜欢
    removeAllILove() {
        return db.remove(null, {multi: true})
    }
}
