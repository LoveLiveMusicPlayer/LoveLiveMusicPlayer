import {execSync} from 'child_process';

exec("wget https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/loading.gif -O assets/image/loading.gif")

function exec(cmd) {
    execSync(process.platform === 'win32' ? cmd.replace(/\//g, '\\') : cmd)
}