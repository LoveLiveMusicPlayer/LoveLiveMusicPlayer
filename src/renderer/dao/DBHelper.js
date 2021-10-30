const db = require('../utils/Database')("database")

export const DBHelper = {
    // 设置 http-server 信息
    async insertOrUpdateHttpServer(info) {
        return db.insertOrUpdate({serverPath: info.path}, {serverPath: info.path, serverPort: info.port})
    },

    // 获取 http-server 信息
    async findHttpServer() {
        let info = null
        const dbList = await db.findAll()
        dbList.map(item => {
            if (item.hasOwnProperty("serverPath")) {
                info = item
            }
        })
        return info
    },
}
