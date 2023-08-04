import {resolveHtmlPath} from "../util";

import { screen } from 'electron';

const createUpdateWindow = function (BrowserWindow: any) {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const trulyWidth = Math.floor(width / 2) > 800 ? 800 : Math.floor(width / 2)
    const obj = {
        width: 150,
        height: 150,
        maxWidth: 150,
        maxHeight: 150,
        minWidth: 150,
        minHeight: 150,
        show: false,
        frame: false,
        x: Math.floor(width / 2) - trulyWidth / 2,
        y: Math.floor(height / 2),
        minimizable: false,
        maximizable: false,
        transparent: true,
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

    let updateWindow = new BrowserWindow(obj);

    updateWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true})
    updateWindow.setAlwaysOnTop(true, "screen-saver")

    updateWindow.loadURL(resolveHtmlPath("update.html"));

    require('@electron/remote/main').enable(updateWindow.webContents)

    // 禁用alt + f4
    updateWindow.webContents.on('before-input-event', (_event: any, input: any) => {
        updateWindow.webContents.setIgnoreMenuShortcuts(input.key === "F4" && input.alt)
    })

    return updateWindow;
};
export default createUpdateWindow;
