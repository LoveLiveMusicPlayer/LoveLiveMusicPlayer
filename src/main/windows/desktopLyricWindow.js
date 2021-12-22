import {resolveHtmlPath} from "../util";
import {ipcMain} from "electron";

const {screen} = require("electron");

let clickX
let clickY
let clientX
let clientY

const createLyricWindow = function (BrowserWindow) {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const trulyWidth = parseInt(width / 2) > 800 ? 800 : parseInt(width / 2)
    const obj = {
        minWidth: 800,
        width: trulyWidth,
        maxWidth: parseInt(width / 10 * 9),
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
            devTools: true,
        },
    };

    let lyricWindow = new BrowserWindow(obj);

    lyricWindow.loadURL(resolveHtmlPath("desktop-lyric.html"));

    require('@electron/remote/main').enable(lyricWindow.webContents)

    ipcMain.on('windowMoving', (e, {mouseX, mouseY}) => {
        if (clickX !== mouseX || clickY !== mouseY) {
            clickX = mouseX
            clickY = mouseY
            clientX = lyricWindow.getSize()[0]
            clientY = lyricWindow.getSize()[1]
        }

        const { x, y } = screen.getCursorScreenPoint()
        lyricWindow.setBounds({
            width: clientX,
            height: clientY,
            x: x - mouseX,
            y: y - mouseY
        });
    });

    return lyricWindow;
};
export default createLyricWindow;
