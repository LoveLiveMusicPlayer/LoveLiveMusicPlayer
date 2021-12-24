import initIpcEvent from "../modules/ipcEvent";
import {getAssetPath} from "../main";
import MenuBuilder from "../modules/menu";

const {resolveHtmlPath} = require("../util");
const {app, shell} = require("electron");

const createMainWindow = function (BrowserWindow) {
    const option = {
        show: true,
        width: 1250,
        height: 728,
        titleBarStyle: 'customButtonsOnHover',
        transparent: true,
        frame: false,
        minWidth: 1024,
        minHeight: 728,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            enableRemoteModule: true,
            contextIsolation: false,
            webSecurity: false
        }
    }

    let mainWindow = new BrowserWindow(option);

    if (process.platform === 'win32') {
        // hook掉标题栏右键菜单
        mainWindow.hookWindowMessage(278, () => {
            mainWindow?.setEnabled(false)
            setTimeout(() => {
                mainWindow?.setEnabled(true)
            }, 100)
            return true
        })
    }

    require('@electron/remote/main').enable(mainWindow.webContents)

    // 初始化进程之间事件监听
    initIpcEvent();

    mainWindow.loadURL(resolveHtmlPath('index.html'));

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
        if (!global.willQuitApp) {
            event.preventDefault()
            mainWindow?.hide()
        } else {
            app.exit(0)
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
        global.lyricWindow = null
    });

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
