import {execSync} from 'child_process';
import fs from 'fs';

const flac_binding_version = "3.0.0"
const node_win32 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/win-x86/flac-bindings-v" + flac_binding_version + "-napi-v8-win32-x86.tar.gz"
const node_win64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/win-x64/flac-bindings-v" + flac_binding_version + "-napi-v8-win32-x64.tar.gz"
const node_linux_arm = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/linux-arm64/flac-bindings-v" + flac_binding_version + "-napi-v8-linux-arm64.tar.gz"
const node_linux64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/linux-x64/flac-bindings-v" + flac_binding_version + "-napi-v8-linux-x64.tar.gz"
const node_mac_arm = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/darwin-arm64/flac-bindings-v" + flac_binding_version + "-napi-v8-darwin-arm64.tar.gz"
const node_mac64 = "https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/flac-bindings/darwin-x64/flac-bindings-v" + flac_binding_version + "-napi-v8-darwin-x64.tar.gz"

if (!exists("assets/image/loading.gif")) {
    const cmd_download = "wget https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/loading.gif -O assets/image/loading.gif"
    const cmd_win = "powershell " + cmd_download
    execSync(process.platform === 'win32' ? cmd_win : cmd_download)
}

exec("mkdirp node_modules/flac-bindings/build/Release")

if (!exists("node_modules/flac-bindings/build/Release/flac-bindings.node")) {
    // 创建node文件目录
    exec('mkdirp release/app/flac-bindings')

    let url = undefined
    const platform = process.platform
    const arch = process.arch

    if (platform === "win32") {
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

    // 解压flac-bindings包
    const cmd_unzip = 'tar -zxvf release/app/flac-bindings/flac-bindings.tar.gz'
    exec(process.platform === "win32" ? "powershell " + cmd_unzip : cmd_unzip)
    // 复制解压文件到指定目录
    const cmd_copy = 'cp build/Release/flac-bindings.node node_modules/flac-bindings/build/Release'
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

function exec(cmd) {
    execSync(process.platform === 'win32' ? cmd.replace(/\//g, '\\') : cmd)
}

function exists(path) {
    return fs.existsSync(process.platform === 'win32' ? path.replace(/\//g, '\\') : path)
}
