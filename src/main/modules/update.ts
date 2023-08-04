import { app, BrowserWindow } from 'electron';
import {autoUpdater} from 'electron-updater'
import https from 'https'
import {VersionUtils} from "../../renderer/utils/VersionUtils";
import {Dialog} from "./dialog";
import createUpdateWindow from '../windows/updateWindow';

const logger = (global as any).mylog

export default class update {
    private callback: Function | undefined;
    private isSuccess = false

    constructor() {
        autoUpdater.autoDownload = false
        autoUpdater.logger = logger
        this.initListener()
    }

    initListener() {
        // https://www.electron.build/auto-update#events
        // https://electronjs.org/docs/api/auto-updater#autoupdaterquitandinstall
        autoUpdater.on('update-downloaded', _info => {
            Dialog({
                type: 'info',
                message: "已更新完成，请重启应用",
                buttons: ["确定"]
            }).then(_ => {
                this.isSuccess = true
                autoUpdater.quitAndInstall(true, true)
            })
        })

        autoUpdater.on('error', _info => {
            if (!this.isSuccess) {
                Dialog({type: 'error', message: "更新失败，请稍后重试"})
            }
        })

        autoUpdater.on('download-progress', progressObj => {
            this.callback?.call(this, JSON.stringify(progressObj))
        })
    }

    checkUpdate(callback: Function) {
        this.callback = callback
        // 这里先拉取更新信息，在对话框中显示版本的更新内容
        const checkUpdateUrl = VersionUtils.getVersionInfo()
        logger.debug("Req url: " + checkUpdateUrl)
        const req = https.request(checkUpdateUrl, req => {
            let message = ''
            req.setEncoding('utf-8')
            req.on('data', chunk => {
                message += chunk.toString()
            })
            req.on('end', () => {
                logger.debug(message)
                const json = JSON.parse(message)
                const localVersion = app.getVersion().split('.').join('')
                const remoteVersion = json.version.split('.').join('')
                logger.debug(`云端APP版本号：${remoteVersion} 本地APP版本号：${localVersion}`)
                if (localVersion <= remoteVersion) {
                    Dialog({type: 'info', message: '已经是最新版本了'})
                } else {
                    Dialog({
                        type: 'info',
                        message: `检测到新版本（${json.version}）是否更新`,
                        buttons: ["取消", "确定"],
                        detail: json.message
                    }).then(rtn => {
                        if (rtn.response === 1) {
                            const app = global as any;
                            app.updateWindow = createUpdateWindow(BrowserWindow)
                            app.lyricWindow.hide()
                            app.mainWindow.hide()
                            autoUpdater.autoDownload = true
                            const updateUrl = json.url + "/" + process.platform + "-" + process.arch;
                            logger.debug(`Req url: ${updateUrl}`)
                            autoUpdater.setFeedURL(updateUrl)
                            autoUpdater.checkForUpdates()
                        }
                    })
                }
            })
        })
        req.end()
    }
}
