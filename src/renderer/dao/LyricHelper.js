const db = require('../utils/Database')("lyric")

export const LyricHelper = {
    async insertOrUpdateLyric(obj) {
        return db.insertOrUpdate({_id: obj._id}, obj)
    },

    async findLyric(_id) {
        return db.findOne({_id: _id})
    }
}
