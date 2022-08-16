import {
    OWNER_OSS_URL_HEAD,
    PRE_BRIDGE_URL,
    PRE_DATA_FILE,
    PRE_VERSION_FILE,
    PROD_BRIDGE_URL,
    PROD_DATA_FILE,
    PROD_VERSION_FILE
} from "./URLHelper";

// 是否是预发环境
const isPre = true
// 是否需要初始化
const isNeedInit = {needInit: true, status: 1}

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
    },

    // 获取版本初始化模式
    getIsNeedInit() {
        return isNeedInit
    }
}
