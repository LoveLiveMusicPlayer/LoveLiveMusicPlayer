import { OSS_URL_HEAD } from './URLHelper';
import { Config } from '../../common/config';

export const VersionUtils = {
    getIsExportExcel() {
        return Config.isExportExcel
    },

    getTransVersion() {
        return Config.transVer
    },

    // 获取版本初始化模式
    getIsNeedInit() {
        return Config.isNeedInit
    },

    // 更新数据的地址
    getDataUrl() {
        return OSS_URL_HEAD + "data/" + (Config.isPre ? "16.2.8" : "v2") + "/data.json"
    },

    // 更新版本的地址
    getVersionInfo() {
        return OSS_URL_HEAD + "version/version.json"
    },

    // 获取开屏提醒的地址
    getVersionHintUrl() {
        return OSS_URL_HEAD + "data/" + (Config.isPre ? "16.2.8" : "v2") + "/data-version.json"
    }
}
