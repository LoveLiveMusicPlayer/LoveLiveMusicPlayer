// @ts-nocheck
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import {app, BrowserWindow, globalShortcut, ipcMain, shell} from 'electron';
import MenuBuilder from './modules/menu';
import {installExtensions, resolveHtmlPath} from './util';
import initIpcEvent from "./modules/ipcEvent";
import createFuncBtn from "./modules/dockAndTray";
import init, {RESOURCES_PATH} from "./modules/inital";
import createLyricWindow from "./windows/desktopLyricWindow";

let mainWindow: BrowserWindow | null = null;
let lyricWindow: BrowserWindow | null = null;
let willQuitApp = false

// 阻止应用多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
}

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

// 设置底部任务栏按钮和缩略图
const setThumbarButtons = function (mainWindow, playing) {
    const prevIcon = createFromPath(getAssetPath("prev.png"))
    const pauseIcon = createFromPath(getAssetPath("pause.png"))
    const playIcon = createFromPath(getAssetPath("play.png"))
    const nextIcon = createFromPath(getAssetPath("next.png"))
    mainWindow.setThumbarButtons([
        {
            tooltip: "上一曲",
            icon: prevIcon,
            click() {
                mainWindow.webContents.send("prevMusic");
            },
        },
        {
            tooltip: playing ? "暂停" : "播放",
            icon: playing ? pauseIcon : playIcon,
            click() {
                mainWindow.webContents.send("playMusic", {
                    value: !playing,
                });
            },
        },
        {
            tooltip: "下一曲",
            icon: nextIcon,
            click() {
                mainWindow.webContents.send("nextMusic");
            },
        },
    ]);
};

init()

const createWindow = async () => {
    // if (
    //     process.env.NODE_ENV === 'development' ||
    //     process.env.DEBUG_PROD === 'true'
    // ) {
    //     await installExtensions();
    // }

    global.mainWindow = mainWindow = new BrowserWindow({
        show: true,
        width: 1250,
        height: 728,
        titleBarStyle: 'customButtonsOnHover',
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
        },
    });

    require('@electron/remote/main').enable(<Electron.WebContents>mainWindow.webContents)

    // 初始化进程之间事件监听
    initIpcEvent();

    await mainWindow.loadURL(resolveHtmlPath('index.html'));

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
        if (!willQuitApp) {
            if (process.platform === 'darwin') {
                event.preventDefault()
                mainWindow?.hide()
            }
        } else {
            app.exit(0)
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
        lyricWindow = null
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
};

app.on('ready', async () => {
    globalShortcut.register('CommandOrControl+P', () => {
        mainWindow?.webContents.send('playMusic')
    })
    createFuncBtn()
    await createWindow()
    global.lyricWindow = lyricWindow = createLyricWindow(BrowserWindow);
    ipcMain.on("thumbar-buttons", (e, {playing}) => {
        if (mainWindow === null) return;
        if (process.platform === "win32") {
            setThumbarButtons(mainWindow, playing);
        }
    });
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
    if (mainWindow === null) createWindow();
    else if (!mainWindow?.isVisible()) {
        mainWindow?.show()
        mainWindow?.focus();
    }
})

app.on('before-quit', () => {
    willQuitApp = true
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
