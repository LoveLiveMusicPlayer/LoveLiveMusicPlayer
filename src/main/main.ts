// @ts-nocheck
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import {app, BrowserWindow, globalShortcut, powerMonitor} from 'electron';
import createFuncBtn, {thumbarButtons} from "./modules/dockAndTray";
import init from "./modules/inital";
import createLyricWindow from "./windows/desktopLyricWindow";
import createMainWindow from "./windows/mainWindow";
import {judgeWinVersion, upReportOpenTime} from "./util";
import Store from "../renderer/utils/Store";
import fs from "fs";
import log from 'electron-log';
import createUpdateWindow from './windows/updateWindow';

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
global.mylog;
global.isDebug = false;

const isWin = process.platform === "win32"
global.winVersion = 0

init()

app.on('ready', async () => {
    globalShortcut.register('CommandOrControl+P', () => {
        global.mainWindow?.webContents.send('playMusic')
    })
    createFuncBtn()
    setTimeout(() => {
        if (isWin) {
            global.winVersion = judgeWinVersion()
        }
        global.isDebug = process.argv.includes("--debug")
        global.mainWindow = createMainWindow(BrowserWindow)
        if (global.isDebug) {
            global.mylog = require('electron-log');
            global.mylog.transports.console.level = 'debug';
            global.mylog.transports.file.level = 'debug';
            global.mylog.debug("##################### app init #####################");
        }
        if (isWin) {
            // 设置底部任务栏按钮和缩略图
            global.mainWindow.setThumbarButtons(thumbarButtons);
        }
    }, 200)
    global.lyricWindow = createLyricWindow(BrowserWindow)
    global.updateWindow = createUpdateWindow(BrowserWindow)
    if (process.platform === 'darwin') {
        await app.dock.show()
    }
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
    if (global.mainWindow === null) createMainWindow((!isWin || global.winVersion > 0) ? null : BrowserWindow)
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
