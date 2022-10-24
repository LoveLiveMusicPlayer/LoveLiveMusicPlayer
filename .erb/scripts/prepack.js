import {execSync} from 'child_process';
import fs from 'fs';

const flac_binding_version = "3.0.0"
const node_win32 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/win-x86/flac-bindings-v" + flac_binding_version + "-napi-v8-win32-x86.tar.gz"
const node_win64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/win-x64/flac-bindings-v" + flac_binding_version + "-napi-v8-win32-x64.tar.gz"
const node_linux_arm = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/linux-arm64/flac-bindings-v" + flac_binding_version + "-napi-v8-linux-arm64.tar.gz"
const node_linux64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/linux-x64/flac-bindings-v" + flac_binding_version + "-napi-v8-linux-x64.tar.gz"
const node_mac_arm = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/darwin-arm64/flac-bindings-v" + flac_binding_version + "-napi-v8-darwin-arm64.tar.gz"
const node_mac64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/darwin-x64/flac-bindings-v" + flac_binding_version + "-napi-v8-darwin-x64.tar.gz"

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
    // 删除上一次安装包目录
    removeDir('release/build')
    // 创建目标目录
    exec('mkdirp release/app/build')
    // 创建node文件目录
    exec('mkdirp release/app/flac-bindings')
    // 下载node文件
    downloadNode(platform, arch)
    // 解压flac-bindings包
    const cmd_unzip = 'tar -zxvf release/app/flac-bindings/flac-bindings.tar.gz'
    exec(process.platform === "win32" ? "powershell " + cmd_unzip : cmd_unzip)
    // 复制解压文件到指定目录
    const cmd_copy = 'cp build/Release/* release/app/build'
    exec(process.platform === "win32" ? "powershell " + cmd_copy : cmd_copy)
    // 清理文件
    removeDir('build')
    removeDir('release/app/flac-bindings')
}

function removeDir(path) {
    if (fs.existsSync(path)) {
        const cmd_rm_dir = 'rm -rf ' + path
        const cmd_win_rm_dir = 'powershell rmdir ' + path + ' -Force -Recurse'
        exec(process.platform === "win32" ? cmd_win_rm_dir : cmd_rm_dir)
    }
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
        const cmd_download = "wget " + url + " -O release/app/flac-bindings/flac-bindings.tar.gz"
        const cmd_win = "powershell " + cmd_download
        execSync(process.platform === "win32" ? cmd_win : cmd_download)
    }
}

function exec(cmd) {
    execSync(process.platform === 'win32' ? cmd.replace(/\//g, '\\') : cmd)
}
