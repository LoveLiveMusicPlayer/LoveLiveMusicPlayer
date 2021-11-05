import {dialog} from 'electron'
import {autoUpdater} from 'electron-updater'
import http from 'http'
import icon from '../../assets/icon.png'

// see  https://www.electron.build/auto-update#events
autoUpdater.on('update-downloaded', info => {
    if (process.env.NODE_ENV === 'production') {
        // https://electronjs.org/docs/api/auto-updater#autoupdaterquitandinstall
        // 这里先拉取更新信息，在对话框中显示版本的更新内容
        const req = http.request('http://localhost:8080/info.txt', req => {
            alert("111")
            let detail = ''
            req.setEncoding('utf-8')
            req.on('data', chunk => {
                detail += chunk.toString()
            })
            req.on('end', () => {
                dialog.showMessageBox(
                    {
                        icon: icon,
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
