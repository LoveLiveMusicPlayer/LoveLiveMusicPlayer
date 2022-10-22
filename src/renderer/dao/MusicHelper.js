const db = require('../utils/Database')("music")

export const MusicHelper = {
    // json文件导入音乐列表
    insertOrUpdateMusic(json, callback) {
        const obj = JSON.parse(json)
        const requests = []
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key].map(async item => {
                    const music = await MusicHelper.findOneMusicByUniqueId(item._id)
                    item.group = key
                    if (music != null && music.hasOwnProperty('timestamp')) {
                        item.timestamp = music.timestamp
                    }
                    requests.push(db.insertOrUpdate({_id: item._id}, item))
                })
            }
        }
        let index = 0;
        requests.forEach(item => {
            item.then(_ => {
                const progress = parseInt((++index) * 100 / requests.length);
                callback(progress);
            })
        });
        return Promise.allSettled(requests)
    },

    // 获取全部音乐
    findAllMusics() {
        return db.findAll()
    },

    // 获取某个企划的全部音乐
    findAllMusicsByGroup(group) {
        return db.findAll({group: group})
    },

    // 根据唯一 id 获取音乐信息
    findOneMusicByUniqueId(id) {
        return db.findOne({_id: id})
    },

    // 根据 id 和 group 获取音乐信息
    findOneMusic(id, group) {
        return db.findOne({id: id, group: group})
    },

    // 根据 专辑 id 和 group 获取对应专辑的音乐列表
    findAllMusicByAlbumId(group, albumId) {
        return db.findAll({group: group, album: albumId})
    },

    findAllMusicRecentlyByLimit() {
        return db.findAll({
            $where: function () {
                const time = this.timestamp
                return time !== undefined && time > 0
            }
        }, {}, {timestamp: -1}, 100)
    },

    // 更新歌曲播放时间戳
    async refreshMusicTimestamp(uid, timestamp) {
        const music = await this.findOneMusicByUniqueId(uid)
        if (music == null) {
            return -1
        }
        if (timestamp === undefined) {
            music.timestamp = new Date().getTime()
        } else {
            music.timestamp = timestamp
        }
        return db.update({_id: uid}, music)
    },

    // 删除全部音乐
    removeAllMusic() {
        return db.remove(null, {multi: true})
    },

    // 根据唯一id删除音乐信息
    removeMusicByUniqueId(id) {
        return db.remove({_id: id})
    }
}
