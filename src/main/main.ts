import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import {app, BrowserWindow, dialog, ipcMain, shell} from 'electron';
import MenuBuilder from './menu';
import {portIsOccupied, resolveHtmlPath} from './util';
import update from "./update";

const httpserver = require('http-server');
const Store = require('electron-store');

Store.initRenderer();
const autoUpdater = new update()

// 当前HTTP服务是否开启
let isHttpServerOpen = false
// http-server实例
let mServer: any

let mainWindow: BrowserWindow | null = null;

let updateCallback = (progressObj: string) => {
    if (mainWindow) {
        const obj = JSON.parse(progressObj)
        if (obj.percent > 0) {
            mainWindow.setProgressBar(obj.percent)
        }
    }
}

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
    const version = app.getVersion().split('.').join('')
    event.sender.send('getAppVersion', version)
})

// 打开一个获取文件的窗口
ipcMain.handle("fileDialog", (_event, _args) => {
    dialog.showOpenDialogSync({properties: ['openFile', 'multiSelections']})
})

// 检查更新
ipcMain.handle("checkUpdate", (_event, _args) => {
    autoUpdater.checkUpdate(updateCallback)
})

app.commandLine.appendSwitch("--disable-http-cache")

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDevelopment =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
    require('electron-debug')();
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.log);
};

const createWindow = async () => {
    if (
        process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true'
    ) {
        await installExtensions();
    }

    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };

    mainWindow = new BrowserWindow({
        show: false,
        width: 1250,
        height: 728,
        titleBarStyle: 'customButtonsOnHover',
        frame: false,
        minWidth: 1024,
        minHeight: 728,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            contextIsolation: false,
            webSecurity: false
        },
    });

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/main/docs/api/browser-window.md#using-ready-to-show-event
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

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // 这里只在生产环境才执行版本检测。
    if (mainWindow === null) createWindow();
});
