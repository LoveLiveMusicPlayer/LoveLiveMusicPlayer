import {ipcMain} from 'electron'
import {autoUpdater} from 'electron-updater'

// win是所有窗口的引用
import {createWindow, win} from '../background'

const path = require('path') // 引入path模块
const _Store = require('electron-store')
const fs = require('fs-extra')
const isMac = process.platform === 'darwin'

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle(updateConfig = undefined) {
    // electron缓存
    let localStore = new _Store()
    // 更新配置
    updateConfig = updateConfig !== undefined ? updateConfig : localStore.get('updateConfig')
    // 更新前，删除本地安装包 ↓
    let updaterCacheDirName = 'lovelive-package'
    const updatePendingPath = path.join(autoUpdater.app.baseCachePath, updaterCacheDirName, 'pending')
    fs.emptyDir(updatePendingPath)
    // 更新前，删除本地安装包 ↑
    let message = {
        error: 'update error',
        checking: 'updating...',
        updateAva: 'fetch new version and downloading...',
        updateNotAva: 'do not to update'
    }
    // 本地开发环境，改变app-update.yml地址
    if (process.env.NODE_ENV === 'development' && !isMac) {
        autoUpdater.updateConfigPath = path.join(__dirname, 'win-unpacked/resources/app-update.yml')
    }
    // 设置服务器更新地址
    autoUpdater.setFeedURL({
        provider: 'generic',
        url: updateConfig.download
    })
    autoUpdater.on('error', function () {
        sendUpdateMessage(message.error)
    })
    autoUpdater.on('checking-for-update', function () {
        sendUpdateMessage(message.checking)
    })
    // 准备更新，打开进度条读取页面，关闭其他页面
    autoUpdater.on('update-available', function (info) {
        sendUpdateMessage(message.updateAva)
        createWindow('update-loading', {
            width: 500,
            height: 300,
            minWidth: 720,
            resizable: false,
            fullscreenable: false,
            frame: false
        })
        for (let key in win) {
            if (key !== 'update-loading') {
                win[key] && win[key].close()
            }
        }
    })
    autoUpdater.on('update-not-available', function (info) {
        sendUpdateMessage(message.updateNotAva)
    })
    // 更新下载进度
    autoUpdater.on('download-progress', function (progressObj) {
        win['update-loading'] && win['update-loading'].webContents.send('download-progress', parseInt(progressObj.percent))
    })
    // 更新完成，重启应用
    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        ipcMain.on('isUpdateNow', (e, arg) => {
            // some code here to handle event
            autoUpdater.quitAndInstall()
        })
        win['update-loading'] && win['update-loading'].webContents.send('isUpdateNow')
    })
    ipcMain.on('checkForUpdate', () => {
        // 执行自动更新检查
        autoUpdater.checkForUpdates()
    })

    // 通过main进程发送事件给renderer进程，提示更新信息
    function sendUpdateMessage(text) {
        win['update-loading'] && win['update-loading'].webContents.send('message', message.error)
    }
}

export default updateHandle
