// @ts-nocheck
import initIpcEvent from "../modules/ipcEvent";
import MenuBuilder from "../modules/menu";
import path from "path";
import {RESOURCES_PATH} from "../modules/inital";
import {clearTimeout} from "timers";
import {globalShortcut} from "electron";
import {upReportOpenTime} from "../util";
const glasstron = require('glasstron-clarity');

const {resolveHtmlPath} = require("../util");
const {shell} = require("electron");
const framelessPlugin = require('../modules/framelessPlugin')

let timer = null

const createMainWindow = function () {
    const option = {
        show: false,
        width: 1250,
        height: 728,
        titleBarStyle: 'customButtonsOnHover',
        transparent: process.platform !== 'win32',
        maximizable: process.platform === 'darwin',
        frame: false,
        minWidth: 1024,
        minHeight: 728,
        roundedCorners: true,
        icon: path.join(RESOURCES_PATH, 'icon.png'),
        vibrancy: 'fullscreen-ui',
        webPreferences: {
            experimentalFeatures: true,
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            enableRemoteModule: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: true
        }
    }

    let mainWindow = new glasstron.BrowserWindow(option);
    mainWindow.blurType = "blurbehind"
    mainWindow.setBlur(true)

    // 修复透明窗口缩放窗口异常
    framelessPlugin.plugin({
        browserWindow: mainWindow
    })

    require('@electron/remote/main').enable(mainWindow.webContents)

    // 初始化进程之间事件监听
    initIpcEvent();

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.on('ready-to-show', () => {
        global.isInit = false
        mainWindow.show()
    })

    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    // 进入全屏时注册 esc 退出功能
    mainWindow.on('enter-full-screen', () => {
        globalShortcut.register('ESC', () => {
            mainWindow.setFullScreen(false)
        })
        mainWindow.webContents.send('enter-full-screen', true)
    })

    // 离开全屏时注销 esc 退出功能
    mainWindow.on('leave-full-screen', () => {
        globalShortcut.unregister('ESC')
        mainWindow.webContents.send('enter-full-screen', false)
    })

    mainWindow.on('close', event => {
        if (!global?.willQuitApp) {
            event.preventDefault()
            if (process.platform === 'linux') {
                upReportOpenTime(global)
            } else {
                mainWindow?.hide()
            }
        } else {
            upReportOpenTime(global)
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
        global?.lyricWindow = null
    });

    mainWindow.on('will-resize', () => {
        global?.lyricWindow?.webContents.send('main-window-resize', true)
        timer && clearTimeout(timer)
        timer = setTimeout(() => {
            global?.lyricWindow?.webContents.send('main-window-resize', false)
        }, 500)
    })

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    return mainWindow
}

export default createMainWindow
