// @ts-nocheck
import {app, dialog, globalShortcut, ipcMain, nativeImage} from "electron";
import {portIsOccupied} from "../util";
import update from "./update";
import {thumbarButtons} from "./dockAndTray";
import path from "path";
import {RESOURCES_PATH} from "./inital";
import Dialog from "./dialog";

const httpserver = require('http-server');
const autoUpdater = new update()

// http-server实例
let mServer

// 当前HTTP服务是否开启
let isHttpServerOpen = false

let updateCallback = (progressObj) => {
    const obj = JSON.parse(progressObj)
    if (obj.percent > 0) {
        global?.mainWindow?.setProgressBar(obj.percent)
    }
}

export default function () {
    // 开启HTTP服务 或 切换端口重启服务
    ipcMain.handle('openHttp', async (event, path, port) => {
        // 获取可用端口号
        portIsOccupied(port).then(port => {
            // 服务已被打开的话要先释放再开启
            if (isHttpServerOpen) {
                mServer.close()
            }
            console.log(`start http-server at ${port}`)
            // 创建HTTP服务(禁用缓存)
            mServer = httpserver.createServer({root: path, cache: -1})
            mServer.listen(port)
            isHttpServerOpen = true
            event.sender.send("openHttpReply", path, port)
        })
    })

    // 重启 App
    ipcMain.handle('restart', () => {
        app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
        app.quit()
    })

    /**
     * 创建多态弹窗
     * @param args[0] "none", "info", "error", "question", "warning"
     * @param args[1] message
     */
    ipcMain.on('msgDialog', (event, args) => {
        Dialog(args)
    })

    // 获取当前 APP 版本号
    ipcMain.on('getAppVersion', event => {
        // 缓存目录: /Users/hoshizora-rin/Library/Application\ Support
        console.log(app.getPath('userData'))
        event.sender.send('getAppVersion', app.getVersion())
    })

    // 打开一个获取文件的窗口
    ipcMain.handle("fileDialog", (_event, _args) => {
        dialog.showOpenDialogSync({properties: ['openFile', 'multiSelections']})
    })

    // 获取当前播放歌曲的名字
    ipcMain.on("musicName", (event, args) => {
        global?.appTray?.setToolTip(args);
    })

    ipcMain.on("setPlaying", (event, isPlaying) => {
        thumbarButtons[1].tooltip = isPlaying ? "暂停" : "播放"
        thumbarButtons[1].icon = nativeImage.createFromPath(path.join(RESOURCES_PATH, isPlaying ? "image/pause.png" : "image/play.png"))
        thumbarButtons[1].click = () => {
            global?.mainWindow?.webContents.send("playMusic");
        }
        global?.mainWindow?.setThumbarButtons(thumbarButtons);
    })

    // 窗口最小化
    ipcMain.on('min', function () {
        global?.mainWindow?.minimize()
    })

    // 窗口最大化
    ipcMain.on('max', function () {
        if (global?.mainWindow?.isMaximized()) {
            globalShortcut.unregisterAll()
        } else {
            globalShortcut.register('ESC', () => {
                global?.mainWindow?.setFullScreen(false)
            })
        }
        global?.mainWindow?.setFullScreen(!global?.mainWindow?.isMaximized())
    })

    // 窗口关闭
    ipcMain.on('close', function () {
        if (process.platform !== 'linux') {
            global?.mainWindow?.hide()
        } else global?.mainWindow?.minimize()
    })

    // 检查更新
    ipcMain.handle("checkUpdate", (_event, _args) => {
        autoUpdater?.checkUpdate(updateCallback)
    })

    ipcMain.on('toggle-desktop-lyric', (event, args) => {
        if (args) {
            global?.lyricWindow?.showInactive()
        } else {
            global?.lyricWindow?.hide()
        }
        global?.mainWindow?.webContents.send('toggle-desktop-lyric-reply')
    })

    ipcMain.on('desktop-lrc-text', (event, args) => {
        args && global?.lyricWindow?.webContents.send('desktop-lrc-text', args)
    })

    ipcMain.on('desktop-lrc-language-change', (event, args) => {
        args && global?.lyricWindow?.webContents.send('desktop-lrc-language-change', args)
    })

    ipcMain.on('main-lrc-language-change', (event, args) => {
        args && global?.mainWindow?.webContents.send('main-lrc-language-change', args)
    })

    ipcMain.on("fix-desktop-lyric", (event, data) => {
        global?.lyricWindow?.setIgnoreMouseEvents(data, {
            forward: true,
        });
        if (data === false) {
            global?.lyricWindow?.webContents.send("show-lock");
        }
    });
}
