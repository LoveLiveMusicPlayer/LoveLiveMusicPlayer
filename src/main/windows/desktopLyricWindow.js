import {resolveHtmlPath} from "../util";

const {screen} = require("electron");

const createLyricWindow = function (BrowserWindow) {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const trulyWidth = parseInt(width / 2) > 800 ? 800 : parseInt(width / 2)
    const obj = {
        minWidth: 800,
        width: trulyWidth,
        maxHeight: 180,
        height: 100,
        minHeight: 100,
        show: false,
        frame: false,
        x: parseInt(width / 2) - trulyWidth / 2,
        y: parseInt(height) - 150,
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
