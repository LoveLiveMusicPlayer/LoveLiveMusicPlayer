// oss url 前缀
const OSS_URL_HEAD = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/"
const OWNER_OSS_URL_HEAD = "https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/LLMP/"

// 初始化检查是否需要强制删库重启
const INIT_CHECK_FILE = OWNER_OSS_URL_HEAD + "init.json"

// 提示用户是否有数据需要更新
const REQUEST_LATEST_VERSION_FILE = "data-version.json"

// 上报统计
const SENTRY_URL = "http://1d2d5d17044544e8b37e78182a2f1c77@139.224.116.225:9000/6"

// 预发环境的数据更新桥接文件
const PRE_BRIDGE_URL = "data-bridge-pre.json"

// 正式环境的数据更新桥接文件
const PROD_BRIDGE_URL = "data-bridge.json"

// 预发环境的数据更新的文件
const PRE_DATA_FILE = "data-pre.json"

// 正式环境的数据更新的文件
const PROD_DATA_FILE = "data.json"

// 预发环境的版本更新文件
const PRE_VERSION_FILE = "version-pre.json"

// 正式环境的版本更新文件
const PROD_VERSION_FILE = "version.json"

module.exports = {
    OSS_URL_HEAD,
    INIT_CHECK_FILE,
    OWNER_OSS_URL_HEAD,
    REQUEST_LATEST_VERSION_FILE,
    SENTRY_URL,
    PRE_BRIDGE_URL,
    PROD_BRIDGE_URL,
    PRE_DATA_FILE,
    PROD_DATA_FILE,
    PRE_VERSION_FILE,
    PROD_VERSION_FILE
}
