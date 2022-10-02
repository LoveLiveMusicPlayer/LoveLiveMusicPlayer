// @ts-nocheck
import initIpcEvent from "../modules/ipcEvent";
import MenuBuilder from "../modules/menu";
import path from "path";
import {RESOURCES_PATH} from "../modules/inital";
import {clearTimeout} from "timers";
import {globalShortcut} from "electron";
import {upReportOpenTime} from "../util";
import {VersionUtils} from "../../renderer/utils/VersionUtils";

const {resolveHtmlPath} = require("../util");
const {shell} = require("electron");
const framelessPlugin = require('../modules/framelessPlugin')

let timer = null

const createMainWindow = function (BrowserWindow: any) {
    const option = {
        show: false,
        width: 1250,
        height: 728,
        titleBarStyle: 'customButtonsOnHover',
        transparent: global.winVersion == 0,
        maximizable: process.platform === 'darwin',
        frame: false,
        minWidth: 1024,
        minHeight: 728,
        blur: true,
        icon: path.join(RESOURCES_PATH, 'icon.png'),
        vibrancy: 'fullscreen-ui',
        paintWhenInitiallyHidden: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            enableRemoteModule: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: VersionUtils.getIsPreEnv()
        }
    }

    let mainWindow = null

    if (BrowserWindow == null) {
        const glasstron = require('glasstron-clarity')
        mainWindow = new glasstron.BrowserWindow(option)
        mainWindow.blurType = "blurbehind"
    } else {
        mainWindow = new BrowserWindow(option)
    }

    // 修复透明窗口缩放窗口异常
    framelessPlugin.plugin({
        browserWindow: mainWindow
    })

    require('@electron/remote/main').enable(mainWindow.webContents)

    // 初始化进程之间事件监听
    initIpcEvent();

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (global.isInit) {
            global.isInit = false
            // windows 需要为了模糊和圆角首次并存，需要关闭再打开
            if (process.platform == "win32") {
                mainWindow.show()
                mainWindow.focus();
                mainWindow.close();
            }
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
