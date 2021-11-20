const db = require('../utils/Database')("iLove")

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
        } else return new Promise(((resolve, reject) => {
            reject('歌曲已经存在')
        }))
    },

    findLoveById(_id) {
        return db.findOne({_id: _id})
    },

    findAllLove() {
        return db.findAll(null, null, {timestamp: 1})
    },

    findLoveByIds(_ids) {
        return db.findAll({_id: _ids})
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
}
