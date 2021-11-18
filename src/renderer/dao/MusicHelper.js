const db = require('../utils/Database')("music")

export const MusicHelper = {
    // json文件导入音乐列表
    insertOrUpdateMusic(json, callback) {
        const obj = JSON.parse(json)
        const requests = []
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key].map(item => {
                    item.group = key
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

    // 根据 id 和 group 获取音乐信息
    findOneMusic(id, group) {
        return db.findOne({id: id, group: group})
    },

    // 根据 专辑 id 和 group 获取对应专辑的音乐列表
    findAllMusicByAlbumId(group, albumId) {
        return db.findAll({group: group, album: albumId})
    },

    // 删除全部音乐
    removeAllMusic() {
        return db.remove(null, {multi: true})
    },

    // 根据id删除音乐信息
    removeMusicById(id) {
        return db.remove({_id: id})
    }
}
