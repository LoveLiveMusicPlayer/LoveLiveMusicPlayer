// @ts-nocheck
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import {app, BrowserWindow, globalShortcut} from 'electron';
import createFuncBtn, {thumbarButtons} from "./modules/dockAndTray";
import init from "./modules/inital";
import createLyricWindow from "./windows/desktopLyricWindow";
import createMainWindow from "./windows/mainWindow";

// 阻止应用多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.exit(0)
}

global.isInit = true
global.startTime = new Date().getTime()

init()

app.on('ready', async () => {
    globalShortcut.register('CommandOrControl+P', () => {
        global.mainWindow?.webContents.send('playMusic')
    })
    createFuncBtn()
    global.mainWindow = createMainWindow(BrowserWindow)
    global.lyricWindow = createLyricWindow(BrowserWindow)
    if (process.platform === "win32") {
        // 设置底部任务栏按钮和缩略图
        global.mainWindow.setThumbarButtons(thumbarButtons);
    }
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
