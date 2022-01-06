// @ts-nocheck
import initIpcEvent from "../modules/ipcEvent";
import MenuBuilder from "../modules/menu";
import path from "path";
import {RESOURCES_PATH} from "../modules/inital";

const {resolveHtmlPath} = require("../util");
const {app, shell, globalShortcut} = require("electron");
const framelessPlugin = require('../modules/framelessPlugin')

const createMainWindow = function (BrowserWindow: any) {
    const option = {
        show: false,
        width: 1250,
        height: 728,
        titleBarStyle: 'customButtonsOnHover',
        transparent: true,
        frame: false,
        minWidth: 1024,
        minHeight: 728,
        icon: path.join(RESOURCES_PATH, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            enableRemoteModule: true,
            contextIsolation: false,
            webSecurity: false
        }
    }

    let mainWindow = new BrowserWindow(option);

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

    mainWindow.on('close', event => {
        if (!global?.willQuitApp) {
            event.preventDefault()
            if (process.platform === 'linux') {
                app.exit(0)
            } else {
                mainWindow?.hide()
            }
        } else {
            app.exit(0)
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
        global?.lyricWindow = null
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    globalShortcut.register('ESC', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.setFullScreen(false)
        }
    })

    return mainWindow
}

export default createMainWindow
