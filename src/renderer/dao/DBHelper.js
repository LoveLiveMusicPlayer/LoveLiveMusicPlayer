const db = require('../utils/Database')("database")

export const DBHelper = {
    // 设置 http-server 信息
    async setHttpServer(info) {
        return db.insertOrUpdate({serverPath: info.path}, {serverPath: info.path, serverPort: info.port})
    },

    // 获取 http-server 信息
    async getHttpServer() {
        let info = null
        const dbList = await db.findAll()
        dbList.map(item => {
            if (item.hasOwnProperty("serverPath")) {
                info = item
            }
        })
        return info
    },

    // 设置背景颜色
    async setBGColor(colors) {
        return db.insertOrUpdate({colors: colors}, {colors: colors})
    },

    // 获取背景颜色
    async getBGColor() {
        let colors = {color1: '#f9f900', color2: '#ea7500'}
        const dbList = await db.findAll()
        dbList.map(item => {
            if (item.hasOwnProperty("colors")) {
                colors = JSON.parse(item.colors)
            }
        })
        return colors
    }
}
