import {dialog} from 'electron'
import {autoUpdater} from 'electron-updater'
import http from 'http'
import path from "path";

autoUpdater.autoDownload = false

// https://www.electron.build/auto-update#events
// https://electronjs.org/docs/api/auto-updater#autoupdaterquitandinstall
autoUpdater.on('update-downloaded', info => {
    if (process.env.NODE_ENV === 'production') {

        const RESOURCES_PATH = path.join(process.resourcesPath, 'assets')

        dialog.showMessageBox({
            type: 'info',
            title: '软件更新',
            message: `已更新到最新版本（${info.version}）请重启应用。`,
            detail: detail,
            buttons: ["确定"],
            noLink: true,
        }).then(_ => {
            autoUpdater.quitAndInstall(true, true)
        })
    }
})

autoUpdater.on('update-available', info => {
    // 这里先拉取更新信息，在对话框中显示版本的更新内容
    const req = http.request('http://192.168.100.194:8080/info.txt', req => {
        let detail = ''
        req.setEncoding('utf-8')
        req.on('data', chunk => {
            detail += chunk.toString()
        })
        req.on('end', () => {
            dialog.showMessageBox({
                type: 'info',
                title: '软件更新',
                message: `检测到新版本（${info.version}）是否更新`,
                detail: detail,
                buttons: ["取消", "确定"],
                noLink: true,
            }).then(index => {
                if (index === 1) {
                    autoUpdater.downloadUpdate()
                }
            })
        })
    })
    req.end()
})

autoUpdater.on('update-not-available', info => {
    dialog.showMessageBox({
        type: 'info',
        title: '软件更新',
        message: '已经是最新版本了',
        buttons: ["知道了"],
        noLink: true,
    })
})

export default autoUpdater
