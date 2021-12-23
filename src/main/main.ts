// @ts-nocheck
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import {app, BrowserWindow, globalShortcut, ipcMain, nativeImage} from 'electron';
import createFuncBtn from "./modules/dockAndTray";
import init, {RESOURCES_PATH} from "./modules/inital";
import createLyricWindow from "./windows/desktopLyricWindow";
import createMainWindow from "./windows/mainWindow";

// 阻止应用多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
}

export const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

// 设置底部任务栏按钮和缩略图
const setThumbarButtons = function (playing) {
    const prevIcon = nativeImage.createFromPath(getAssetPath("prev.png"))
    const pauseIcon = nativeImage.createFromPath(getAssetPath("pause.png"))
    const playIcon = nativeImage.createFromPath(getAssetPath("play.png"))
    const nextIcon = nativeImage.createFromPath(getAssetPath("next.png"))
    global.mainWindow.setThumbarButtons([
        {
            tooltip: "上一曲",
            icon: prevIcon,
            click() {
                global.mainWindow.webContents.send("prevMusic");
            },
        },
        {
            tooltip: playing ? "暂停" : "播放",
            icon: playing ? pauseIcon : playIcon,
            click() {
                global.mainWindow.webContents.send("playMusic", {
                    value: !playing,
                });
            },
        },
        {
            tooltip: "下一曲",
            icon: nextIcon,
            click() {
                global.mainWindow.webContents.send("nextMusic");
            },
        },
    ]);
};

init()

app.on('ready', async () => {
    globalShortcut.register('CommandOrControl+P', () => {
        global.mainWindow?.webContents.send('playMusic')
    })
    createFuncBtn()
    global.mainWindow = createMainWindow(BrowserWindow)
    global.lyricWindow = createLyricWindow(BrowserWindow);
    ipcMain.on("thumbar-buttons", (e, {playing}) => {
        if (global.mainWindow === null) return;
        if (process.platform === "win32") {
            setThumbarButtons(playing);
        }
    });
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
    if (global.mainWindow === null) createMainWindow();
    else if (!global.mainWindow?.isVisible()) {
        global.mainWindow?.show()
        global.mainWindow?.focus();
    }
})

app.on('before-quit', () => {
    global.willQuitApp = true
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
