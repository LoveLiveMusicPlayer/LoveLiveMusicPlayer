import {app, dialog} from 'electron'
import {autoUpdater} from 'electron-updater'
import http from 'http'
import path from "path";

// see  https://www.electron.build/auto-update#events
autoUpdater.on('update-downloaded', info => {
    if (process.env.NODE_ENV === 'production') {

        const RESOURCES_PATH = app.isPackaged
            ? path.join(process.resourcesPath, 'assets')
            : path.join(__dirname, '../../assets');

        const getAssetPath = (path) => {
            return path.join(RESOURCES_PATH, ...path);
        };

        // https://electronjs.org/docs/api/auto-updater#autoupdaterquitandinstall
        // 这里先拉取更新信息，在对话框中显示版本的更新内容
        const req = http.request('http://192.168.100.194:8080/info.txt', req => {
            let detail = ''
            req.setEncoding('utf-8')
            req.on('data', chunk => {
                detail += chunk.toString()
            })
            req.on('end', () => {
                dialog.showMessageBox(
                    {
                        icon: getAssetPath("icon.png"),
                        type: 'info',
                        title: '软件更新',
                        message: `已更新到最新版本（${info.version}）请重启应用。`,
                        detail: detail,
                        buttons: ['确定']
                    },
                    idx => {
                        // 点击确定的时候执行更新
                        if (idx === 0) {
                            autoUpdater.quitAndInstall()
                        }
                    }
                )
            })
        })
        req.end()
    }
})
export default autoUpdater
