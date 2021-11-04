import {EventEmitter} from 'events'
import {dialog} from 'electron'
import {autoUpdater} from 'electron-updater'

export default class UpdateManager extends EventEmitter {
    constructor(options = {}) {
        super()
        this.options = options

        this.isChecking = false
        this.updater = autoUpdater
        this.updater.autoDownload = false
        this.updater.autoInstallOnAppQuit = false
        this.autoCheckData = {
            checkEnable: this.options.autoCheck,
            userCheck: false
        }
        this.init()
    }

    init() {
        this.updater.on('checking-for-update', this.checkingForUpdate.bind(this))
        this.updater.on('update-available', this.updateAvailable.bind(this))
        this.updater.on('update-not-available', this.updateNotAvailable.bind(this))
        this.updater.on('download-progress', this.updateDownloadProgress.bind(this))
        this.updater.on('update-downloaded', this.updateDownloaded.bind(this))
        this.updater.on('update-cancelled', this.updateCancelled.bind(this))
        this.updater.on('error', this.updateError.bind(this))

        if (this.autoCheckData.checkEnable && !this.isChecking) {
            this.autoCheckData.userCheck = false
            this.updater.checkForUpdates()
        }
    }

    check() {
        this.autoCheckData.userCheck = true
        this.updater.checkForUpdates()
    }

    checkingForUpdate() {
        this.isChecking = true
        this.emit('checking')
    }

    updateAvailable(event, info) {
        this.emit('update-available', info)
        dialog.showMessageBox({
            type: 'info',
            title: "有升级",
            message: "是否升级?",
            buttons: ["升级", "取消"],
            cancelId: 1
        }).then(({response}) => {
            if (response === 0) {
                this.updater.downloadUpdate()
            }
        })
    }

    updateNotAvailable(event, info) {
        this.isChecking = false
        this.emit('update-not-available', info)
        if (this.autoCheckData.userCheck) {
            dialog.showMessageBox({
                title: "没有升级",
                message: "您无需升级"
            })
        }
    }

    /**
     * autoUpdater:download-progress
     * @param {Object} event
     * progress,
     * bytesPerSecond,
     * percent,
     * total,
     * transferred
     */
    updateDownloadProgress(event) {
        this.emit('download-progress', event)
    }

    updateDownloaded(event, info) {
        this.emit('update-downloaded', info)
        dialog.showMessageBox({
            title: "完成",
            message: "app 升级成功"
        }).then(_ => {
            this.isChecking = false
            this.emit('will-updated')
            setTimeout(() => {
                this.updater.quitAndInstall()
            }, 200)
        })
    }

    updateCancelled() {
        this.isChecking = false
    }

    updateError(event, error) {
        this.isChecking = false
        this.emit('update-error', error)
        const msg = (error == null)
            ? "更新失败"
            : (error.stack || error).toString()

        dialog.showErrorBox('Error', msg)
    }
}
