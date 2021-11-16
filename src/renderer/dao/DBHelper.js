import {AppUtils} from "../utils/AppUtils";
import Store from "../utils/Store"

export const DBHelper = {
    // 设置 http-server 信息
    setHttpServer(info) {
        Store.set("serverPath", info.path)
        Store.set("serverPort", info.port)
    },

    // 获取 http-server 信息
    getHttpServer() {
        let info = null
        const path = Store.get("serverPath")
        const port = Store.get("serverPort")
        if (!AppUtils.isEmpty(path) && !AppUtils.isEmpty(port)) {
            info = {path: path, port: port}
        }
        return info
    },

    // 设置背景颜色
    setBGColor(colors) {
        Store.set("colors", colors)
    },

    // 获取背景颜色
    getBGColor() {
        let colors = {color1: '#f9f900', color2: '#ea7500'}
        const tempColors = Store.get("colors")
        if (!AppUtils.isEmpty(tempColors)) {
            colors = JSON.parse(tempColors)
        }
        return colors
    }
}
