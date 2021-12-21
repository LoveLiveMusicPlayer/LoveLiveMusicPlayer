// 是否是预发环境
const isPre = true

export const VersionUtils = {
    refreshDataUrl() {
        if (isPre) {
            return 'https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/info-pre.json'
        } else {
            return 'https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/info.json'
        }
    }
}
