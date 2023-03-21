const db = require('../utils/Database')("album")

export const AlbumHelper = {

    // json文件导入专辑列表
    insertOrUpdateAlbum(json, callback) {
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
        return Promise.allSettled(requests);
    },

    // 获取全部专辑
    findAllAlbums() {
        return db.findAll()
    },

    // 获取某个企划的全部专辑
    findAllAlbumsByGroup(group) {
        return db.findAll({group: group}, null, {id: 1})
    },

    findAlbumsFromIndexByLimit(index, limit) {
        return db.find(index, limit)
    },

    // 根据唯一id获取专辑信息
    findOneAlbumByUniqueId(id) {
        return db.findOne({_id: id})
    },

    // 根据专辑id获取专辑信息
    findOneAlbumByAlbumId(group, id) {
        return db.findOne({group: group, id: id})
    },

    // 删除全部专辑
    removeAllAlbum() {
        return db.remove(null, {multi: true})
    },

    // 根据id删除专辑信息
    removeAlbumById(id) {
        return db.remove({_id: id})
    }
}
