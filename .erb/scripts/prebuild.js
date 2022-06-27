import {execSync} from 'child_process';

// 创建目标目录
const mkdirBuild = 'mkdirp release/app/build'
exec(mkdirBuild)

export default function handle(platform, arch) {
    const dirName = 'release/app/flac-bindings/' + platform + '-' + arch
    // 解压flac-bindings包
    const cmd_unzip = 'tar -zxvf ' + dirName + '/*'
    exec(cmd_unzip)
    // 复制解压文件到指定目录
    const cmd_copy = 'cp build/Release/* release/app/build'
    exec(cmd_copy)
    // 删除解压文件目录
    const rmdir_build = 'rm -rf build'
    exec(rmdir_build)
}

process.argv.shift()
process.argv.shift()

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

function exec(cmd) {
    return execSync(process.platform === 'win32' ? cmd.replace(/\//g, '\\') : cmd)
}