import {resolveHtmlPath} from "../util";

const {screen} = require("electron");

const createLyricWindow = function (BrowserWindow) {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const obj = {
        minWidth: 500,
        width: width / 3,
        height: 100,
        show: false,
        frame: false,
        x: width / 2,
        y: height - 50,
        fullscreenable: false,
        minimizable: false,
        maximizable: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true, // 任务栏中不显示窗口
        closable: false,
        hasShadow: process.platform !== "darwin",
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            devTools: false,
        },
    };

    let lyricWindow = new BrowserWindow(obj);

    lyricWindow.loadURL(resolveHtmlPath("desktop-lyric.html"));

    require('@electron/remote/main').enable(lyricWindow.webContents)
    // lyricWindow.setIgnoreMouseEvents(true)

    return lyricWindow;
};
export default createLyricWindow;
