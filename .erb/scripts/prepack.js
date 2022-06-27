import {execSync} from 'child_process';

const node_win32 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/win-x86/flac-bindings-v2.7.1-napi-v8-win32-x86.tar.gz"
const node_win64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/win-x64/flac-bindings-v2.7.1-napi-v8-win32-x64.tar.gz"
const node_linux_arm = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/linux-arm64/flac-bindings-v2.7.1-napi-v8-linux-arm64.tar.gz"
const node_linux64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/linux-x64/flac-bindings-v2.7.1-napi-v8-linux-x64.tar.gz"
const node_mac_arm = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/darwin-arm64/flac-bindings-v2.7.1-napi-v8-darwin-arm64.tar.gz"
const node_mac64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/darwin-x64/flac-bindings-v2.7.1-napi-v8-darwin-x64.tar.gz"

let platform = undefined
let arch = undefined

for (const item of process.argv) {
    if (platform === undefined && item.startsWith("platfrom")) {
        platform = item.replace("platfrom=", "")
    } else if (arch === undefined && item.startsWith("arch")) {
        arch = item.replace("arch=", "")
    }
}

handle(platform, arch)

function handle(platform, arch) {
    // 创建目标目录
    exec('mkdirp release/app/build')
    // 创建node文件目录
    exec('mkdirp release/app/flac-bindings')
    // 下载node文件
    downloadNode(platform, arch)
    // 解压flac-bindings包
    exec('tar -zxvf release/app/flac-bindings/*')
    // 复制解压文件到指定目录
    exec('cp build/Release/* release/app/build')
    // 清理文件
    exec('rm -rf build')
    exec('rm -rf release/app/flac-bindings')
}

function downloadNode(platform, arch) {
    let url = undefined
    if (platform === "win") {
        if (arch === "x86") {
            url = node_win32
        } else if (arch === "x64") {
            url = node_win64
        }
    } else if (platform === "linux") {
        if (arch === "arm64") {
            url = node_linux_arm
        } else if (arch === "x64") {
            url = node_linux64
        }
    } else if (platform === "darwin") {
        if (arch === "arm64") {
            url = node_mac_arm
        } else if (arch === "x64") {
            url = node_mac64
        }
    }
    if (url !== undefined) {
        exec("wget " + url + " -O release/app/flac-bindings/flac-bindings.tar.gz")
    }
}

function exec(cmd) {
    execSync(process.platform === 'win32' ? cmd.replace(/\//g, '\\') : cmd)
}