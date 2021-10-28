const db = require('../utils/Database')("database")

export const DBHelper = {
    // 设置 http 地址
    async insertOrUpdateHttpServer(rootDir) {
        await db.remove({rootDir: rootDir})
        return db.insertOrUpdate({rootDir: rootDir}, {rootDir: rootDir})
    },

    // 获取 http 地址
    async findHttpServer() {
        let http = null
        const dbList = await db.findAll()
        dbList.map(item => {
            if (item.hasOwnProperty("rootDir")) {
                http = item["rootDir"]
            }
        })
        return http
    }
}
