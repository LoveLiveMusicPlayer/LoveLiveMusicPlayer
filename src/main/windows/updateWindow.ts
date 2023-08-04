import {resolveHtmlPath} from "../util";

import { screen } from 'electron';

const createUpdateWindow = function (BrowserWindow: any) {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const obj = {
        width: 325,
        height: 325,
        maxWidth: 325,
        maxHeight: 325,
        minWidth: 325,
        minHeight: 325,
        show: false,
        frame: false,
        x: Math.floor(width / 2) - 325 / 2,
        y: Math.floor(height / 2) - 325 / 2,
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
    updateWindow.setIgnoreMouseEvents(true, { forward: true });

    updateWindow.loadURL(resolveHtmlPath("update.html"));

    require('@electron/remote/main').enable(updateWindow.webContents)

    // 禁用alt + f4
    updateWindow.webContents.on('before-input-event', (_event: any, input: any) => {
        updateWindow.webContents.setIgnoreMenuShortcuts(input.key === "F4" && input.alt)
    })

    return updateWindow;
};
export default createUpdateWindow;
