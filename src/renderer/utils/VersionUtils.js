import {
    OWNER_OSS_URL_HEAD,
    BRIDGE_URL,
    DATA_FILE,
    VERSION_FILE,
    REQUEST_LATEST_VERSION_FILE
} from "./URLHelper";

// 是否是预发环境
const isPre = true
// 是否需要清空某些数据表? 0: 不需要 1: 删除歌库 2: 删除全部
const isNeedInit = {needInit: true, status: 0}

export const VersionUtils = {
    // 获取连接桥跳板
    getBridgeUrl(appVersion) {
        return OWNER_OSS_URL_HEAD + appVersion + isPre ? "/pre/" : "/prod/" + BRIDGE_URL
    },

    // 更新数据的地址
    getRefreshDataUrl(bridgeUrl, appVersion) {
        return bridgeUrl + appVersion + isPre ? "/pre/" : "/prod/" + DATA_FILE
    },

    // 更新版本的地址
    getVersionInfo() {
        return OWNER_OSS_URL_HEAD + isPre ? "version/pre/" : "version/prod/" + VERSION_FILE
    },

    // 获取版本初始化模式
    getIsNeedInit() {
        return isNeedInit
    },

    // 获取开屏提醒的地址
    getVersionHintUrl(appVersion) {
        return OWNER_OSS_URL_HEAD + appVersion + isPre ? "/pre/" : "/prod/" + REQUEST_LATEST_VERSION_FILE
    }
}
