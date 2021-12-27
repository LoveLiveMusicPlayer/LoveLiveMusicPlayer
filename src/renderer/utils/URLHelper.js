// oss url 前缀
const OSS_URL_HEAD = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/"

// 初始化检查是否需要强制删库重启
const INIT_CHECK_FILE = "https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/init.json"

// 提示用户是否有数据需要更新
const REQUEST_LATEST_VERSION_URL = "https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/data-version.json"

// 上报统计
const SENTRY_URL = "http://1d2d5d17044544e8b37e78182a2f1c77@139.224.116.225:9000/6"

// 预发环境
const PRE_URL = "https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/info-pre.json"

// 正式环境
const PROD_URL = "https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/info.json"

module.exports = {
    OSS_URL_HEAD,
    INIT_CHECK_FILE,
    REQUEST_LATEST_VERSION_URL,
    SENTRY_URL,
    PRE_URL,
    PROD_URL
}
