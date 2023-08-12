import { DATA_OSS_URL_HEAD, ROOT_OSS_URL_HEAD } from './URLHelper';

// 是否是预发环境
const isPre = true;
// 是否需要清空歌曲库
const isNeedInit = false
// 是否是要导出excel
const isExportExcel = false
// 传输协议版本号
const transVer = 1

export const VersionUtils = {
    getIsExportExcel() {
        return isExportExcel
    },

    getTransVersion() {
        return transVer
    },

    // 获取版本初始化模式
    getIsNeedInit() {
        return isNeedInit
    },

    // 更新数据的地址
    getDataUrl() {
        return DATA_OSS_URL_HEAD + "data/" + (isPre ? "16.2.8/" : "v2/") + "data.json"
    },

    // 更新版本的地址
    getVersionInfo() {
        return ROOT_OSS_URL_HEAD + "version/" + (isPre ? "pre/" : "prod/") + "version.json"
    },

    // 获取开屏提醒的地址
    getVersionHintUrl() {
        return ROOT_OSS_URL_HEAD + (isPre ? "16.2.8/" : "v2/") + "data-version.json"
    }
}
