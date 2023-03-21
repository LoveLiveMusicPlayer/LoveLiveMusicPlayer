// oss url 前缀
const OSS_URL_HEAD = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/"
const LYRIC_URL_HEAD = "https://llmp-oss.oss-cn-hongkong.aliyuncs.com/"
const OWNER_OSS_URL_HEAD = "https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/LLMP/"

// 提示用户是否有数据需要更新
const REQUEST_LATEST_VERSION_FILE = "data-version.json"

// 上报统计
const SENTRY_URL = "http://1d2d5d17044544e8b37e78182a2f1c77@139.224.116.225:9000/6"

// 数据更新桥接文件
const BRIDGE_URL = "data-bridge.json"

// 数据更新的文件
const DATA_FILE = "data.json"

// 预发环境的版本更新文件
const VERSION_FILE = "version.json"

module.exports = {
    OSS_URL_HEAD,
    LYRIC_URL_HEAD,
    OWNER_OSS_URL_HEAD,
    REQUEST_LATEST_VERSION_FILE,
    SENTRY_URL,
    BRIDGE_URL,
    DATA_FILE,
    VERSION_FILE
}
