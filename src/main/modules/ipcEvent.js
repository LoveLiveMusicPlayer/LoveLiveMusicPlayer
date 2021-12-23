import {app, dialog, ipcMain} from "electron";
import {portIsOccupied} from "../util";
import update from "./update";

const httpserver = require('http-server');
const autoUpdater = new update()

// http-server实例
let mServer

// 当前HTTP服务是否开启
let isHttpServerOpen = false

let updateCallback = (progressObj) => {
    if (global.mainWindow) {
        const obj = JSON.parse(progressObj)
        if (obj.percent > 0) {
            global.mainWindow.setProgressBar(obj.percent)
        }
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
        let title = ""
        switch (args.type) {
            case "info":
                title = "提示"
                break
            case "error":
                title = "错误"
                break
            case "question":
                title = "请示"
                break
            case "warning":
                title = "警告"
                break
            default:
                break
        }
        dialog.showMessageBox({
            type: args.type,// 图标类型
            title: title,// 信息提示框标题
            message: args.message,// 信息提示框内容
            buttons: ["知道了"],// 下方显示的按钮
            noLink: true, // win下的样式
            // icon:nativeImage.createFromPath("./icon/png.png"),// 图标
            // cancelId: 1// 点击x号关闭返回值
        }).then(returnValue => {
            event.sender.send("msgDialogCallback", returnValue.response)
        })
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
        global.appTray?.setToolTip(args);
    })

    // 窗口最小化
    ipcMain.on('min', function () {
        global.mainWindow?.minimize()
    })

    // 窗口最大化
    ipcMain.on('max', function () {
        if (global.mainWindow?.isMaximized()) {
            global.mainWindow?.restore()
        } else {
            global.mainWindow?.maximize()
        }
    })

    // 窗口关闭
    ipcMain.on('close', function () {
        global.mainWindow?.hide()
    })

    // 检查更新
    ipcMain.handle("checkUpdate", (_event, _args) => {
        autoUpdater.checkUpdate(updateCallback)
    })

    ipcMain.on('toggle-desktop-lyric', (event, args) => {
        if (args) {
            global.lyricWindow?.showInactive()
        } else {
            global.lyricWindow?.hide()
        }
        global.mainWindow?.webContents.send('toggle-desktop-lyric-reply')
    })

    ipcMain.on('desktop-lrc-text', (event, args) => {
        global.lyricWindow?.webContents.send('desktop-lrc-text', args)
    })

    ipcMain.on('desktop-lrc-language-change', (event, args) => {
        global.lyricWindow?.webContents.send('desktop-lrc-language-change', args)
    })

    ipcMain.on("fix-desktop-lyric", (event, data) => {
        global.lyricWindow?.setIgnoreMouseEvents(data, {
            forward: true,
        });
        if (data === false) {
            global.lyricWindow?.webContents.send("show-lock");
        }
    });
}
