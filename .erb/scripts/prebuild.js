import {execSync} from 'child_process';
import fs from 'fs';

if (exists("assets/image/loading.gif")) {
    return
}
const cmd_download = "wget https://video-file-upload.oss-cn-hangzhou.aliyuncs.com/LLMP/loading.gif -O assets/image/loading.gif"
const cmd_win = "powershell " + cmd_download
execSync(process.platform === 'win32' ? cmd_win : cmd_download)

function exists(path) {
    return fs.existsSync(process.platform === 'win32' ? path.replace(/\//g, '\\') : path)
}
