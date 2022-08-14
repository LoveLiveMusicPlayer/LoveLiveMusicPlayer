import {
    PRE_BRIDGE_URL,
    PROD_BRIDGE_URL,
    OWNER_OSS_URL_HEAD,
    PRE_VERSION_FILE,
    PROD_VERSION_FILE,
    PRE_DATA_FILE,
    PROD_DATA_FILE
} from "./URLHelper";

// 是否是预发环境
const isPre = true

export const VersionUtils = {
    // 获取连接桥跳板
    getBridgeUrl(appVersion) {
        return OWNER_OSS_URL_HEAD + appVersion + "/" + (isPre ? PRE_BRIDGE_URL : PROD_BRIDGE_URL)
    },

    // 更新数据的地址
    getRefreshDataUrl(bridgeUrl, appVersion) {
        return bridgeUrl + appVersion + "/" + (isPre ? PRE_DATA_FILE : PROD_DATA_FILE)
    },

    // 更新版本的地址
    getVersionInfo() {
        return OWNER_OSS_URL_HEAD + (isPre ? PRE_VERSION_FILE : PROD_VERSION_FILE)
    }
}
