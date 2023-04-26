const db = require('../utils/Database')("lyric")

export const LyricHelper = {
    async insertOrUpdateLyric(obj) {
        return db.insertOrUpdate({_id: obj._id}, obj)
    },

    async findLyric(_id) {
        return db.findOne({_id: _id})
    },

    // 删除指定id歌词
    async removeLyric(_id) {
        return db.remove({_id: _id})
    },

    // 删除全部歌词
    removeAllLyric() {
        return db.remove(null, {multi: true})
    },
}
