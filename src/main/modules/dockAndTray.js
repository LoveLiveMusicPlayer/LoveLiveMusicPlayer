import {app, Menu, shell, Tray} from "electron";
import path from "path";

let appTray = null

const dockMenu = Menu.buildFromTemplate([
    {
        label: '播放/暂停',
        click() {
            global.mainWindow?.webContents.send('playMusic')
        }
    },
    {
        label: '上一首',
        click() {
            global.mainWindow?.webContents.send('prevMusic')
        }
    },
    {
        label: '下一首',
        click() {
            global.mainWindow?.webContents.send('nextMusic')
        }
    },
    {
        label: '关于',
        click() {
            shell.openExternal("https://github.com/zhushenwudi/LoveLiveMusicPlayer")
        }
    }
])

//系统托盘右键菜单
const trayMenuTemplate = [
    {
        label: '播放/暂停',
        click() {
            global.mainWindow?.webContents.send('playMusic')
        }
    },
    {
        label: '上一首',
        click() {
            global.mainWindow?.webContents.send('prevMusic')
        }
    },
    {
        label: '下一首',
        click() {
            global.mainWindow?.webContents.send('nextMusic')
        }
    },
    {
        label: '关于',
        click() {
            shell.openExternal("https://github.com/zhushenwudi/LoveLiveMusicPlayer")
        }
    },
    {
        label: '退出',
        click() {
            app.quit();
        }
    }
];

export default function () {
    if (process.platform === 'darwin') {
        app.dock.setMenu(dockMenu)
    } else if (process.platform === 'win32') {
        appTray = new Tray(path.join(RESOURCES_PATH, 'icon.ico'));

        //图标的上下文菜单
        const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

        //设置此托盘图标的悬停提示内容
        appTray.setToolTip('LoveLive!');

        appTray.on('click', () => {
            if (!global.mainWindow?.isVisible()) {
                global.mainWindow?.show()
                global.mainWindow?.focus();
            } else if (global.mainWindow?.isMinimized()) {
                global.mainWindow?.restore()
            }
        })

        //设置此图标的上下文菜单
        appTray.setContextMenu(contextMenu);
    }
}
