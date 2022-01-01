import {resolveHtmlPath} from "../util";
import {ipcMain} from "electron";

const {screen} = require("electron");

let clickX: number
let clickY: number
let clientX: number
let clientY: number

const createLyricWindow = function (BrowserWindow: any) {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const trulyWidth = Math.floor(width / 2) > 800 ? 800 : Math.floor(width / 2)
    const obj = {
        minWidth: 800,
        width: trulyWidth,
        maxWidth: Math.floor(width / 10 * 9),
        maxHeight: 180,
        height: 100,
        minHeight: 100,
        show: false,
        frame: false,
        x: Math.floor(width / 2) - trulyWidth / 2,
        y: Math.floor(height) - 150,
        fullscreenable: false,
        minimizable: false,
        maximizable: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true, // 任务栏中不显示窗口
        closable: false,
        hasShadow: false,
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

    ipcMain.on('windowMoving', (_event, {mouseX, mouseY}) => {
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

    // 禁用alt + f4
    lyricWindow.webContents.on('before-input-event', (_event: any, input: any) => {
        lyricWindow.webContents.setIgnoreMenuShortcuts(input.key === "F4" && input.alt)
    })

    return lyricWindow;
};
export default createLyricWindow;
