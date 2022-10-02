// @ts-nocheck
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import {app, BrowserWindow, globalShortcut, powerMonitor} from 'electron';
import createFuncBtn, {thumbarButtons} from "./modules/dockAndTray";
import init from "./modules/inital";
import createLyricWindow from "./windows/desktopLyricWindow";
import createMainWindow from "./windows/mainWindow";
import {upReportOpenTime} from "./util";
const os = require('os')

// 阻止应用多开
const isAppInstance = app.requestSingleInstanceLock()
if (!isAppInstance) {
    app.exit(0)
} else {
    app.on('second-instance', (event, argv, workingDirectory, additionalData, ackCallback) => {
        if (global.mainWindow?.isMinimized()) {
            global.mainWindow?.restore()
        }
        global.mainWindow?.focus()
        global.mainWindow?.show()
    })
}

global.isInit = true
global.startTime = new Date().getTime()
global.willQuitApp = false

init()

app.on('ready', async () => {
    globalShortcut.register('CommandOrControl+P', () => {
        global.mainWindow?.webContents.send('playMusic')
    })
    createFuncBtn()

    setTimeout(() => {
        const versionArr = os.release().split(".")
        const version = Number(versionArr[0] + versionArr[1])
        const isWindowsAndUnderWin10 = process.platform === "win32" && version < 100
        global.mainWindow = createMainWindow(isWindowsAndUnderWin10 ? BrowserWindow : null)

        if (process.platform === "win32") {
            // 设置底部任务栏按钮和缩略图
            global.mainWindow.setThumbarButtons(thumbarButtons);
        }
    }, process.platform == "linux" ? 1000 : 0)
    global.lyricWindow = createLyricWindow(BrowserWindow)
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
    if (global.mainWindow === null) createMainWindow()
    else if (!global.mainWindow?.isVisible()) {
        global.mainWindow?.show()
        global.mainWindow?.focus()
    }
})

app.on('before-quit', () => {
    global.willQuitApp = true
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

powerMonitor.on('shutdown', e => {
    e.preventDefault()
    upReportOpenTime(global)
})
