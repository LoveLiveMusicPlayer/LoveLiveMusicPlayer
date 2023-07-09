import {app, BrowserWindow, Menu, MenuItemConstructorOptions, shell,} from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string;
    submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
    mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    buildMenu(): Menu {
        if (
            process.env.NODE_ENV === 'development' ||
            process.env.DEBUG_PROD === 'true'
        ) {
            this.setupDevelopmentEnvironment();
        }

        const template =
            process.platform === 'darwin'
                ? this.buildDarwinTemplate()
                : this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupDevelopmentEnvironment(): void {
        this.mainWindow.webContents.on('context-menu', (_, props) => {
            const {x, y} = props;

            Menu.buildFromTemplate([
                {
                    label: '审查元素',
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y);
                    },
                },
            ]).popup({window: this.mainWindow});
        });
    }

    buildDarwinTemplate(): MenuItemConstructorOptions[] {
        const subMenuAbout: DarwinMenuItemConstructorOptions = {
            label: 'LoveLive音乐播放器',
            submenu: [
                {
                    label: '关于程序',
                    selector: 'orderFrontStandardAboutPanel:',
                },
                {type: 'separator'},
                {label: 'Services', submenu: []},
                {type: 'separator'},
                {
                    label: '隐藏页面',
                    accelerator: 'Command+H',
                    selector: 'hide:',
                },
                {
                    label: '隐藏其他页面',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:',
                },
                {label: '显示全部页面', selector: 'unhideAllApplications:'},
                {type: 'separator'},
                {
                    label: '退出',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        };
        const subMenuEdit: DarwinMenuItemConstructorOptions = {
            label: '编辑',
            submenu: [
                {
                    label: '全部选中',
                    accelerator: 'Command+A',
                    selector: 'selectAll:',
                },
            ],
        };
        const subMenuView: MenuItemConstructorOptions = {
            label: '开发工具',
            submenu: [
                {
                    label: '热更新',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    },
                },
                {
                    label: '调试工具',
                    accelerator: 'Alt+Command+I',
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    },
                },
            ],
        };
        const subMenuWindow: DarwinMenuItemConstructorOptions = {
            label: '窗口',
            submenu: [
                {
                    label: this.mainWindow.isFullScreen() ? '窗口化' : '全屏',
                    accelerator: 'F11',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
                {
                    label: '最小化',
                    accelerator: 'Command+M',
                    selector: 'performMiniaturize:',
                },
                {label: '关闭', accelerator: 'Command+W', click: () => this.mainWindow.close()},
                {type: 'separator'},
                {label: 'Bring All to Front', selector: 'arrangeInFront:'},
            ],
        };
        const subMenuHelp: MenuItemConstructorOptions = {
            label: '开源',
            submenu: [
                {
                    label: 'Github',
                    click() {
                        shell.openExternal(
                            'https://github.com/zhushenwudi/LoveLiveMusicPlayer'
                        );
                    },
                },
                {
                    label: '提Bug',
                    click() {
                        shell.openExternal('https://github.com/zhushenwudi/LoveLiveMusicPlayer/issues');
                    },
                },
            ],
        };

        const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
        return isDev ? [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp] :
            [subMenuAbout, subMenuEdit, subMenuWindow, subMenuHelp];
    }

    buildDefaultTemplate() {
        return [
            {
                label: '&LoveLive音乐播放器',
                submenu: [
                    {
                        label: '&退出',
                        accelerator: 'Ctrl+Q',
                        click: () => {
                            this.mainWindow?.close();
                        },
                    },
                ],
            },
            {
                label: '&开发工具',
                submenu:
                    process.env.NODE_ENV === 'development' ||
                    process.env.DEBUG_PROD === 'true'
                        ? [
                            {
                                label: '&热更新',
                                accelerator: 'Ctrl+R',
                                click: () => {
                                    this.mainWindow.webContents.reload();
                                },
                            },
                            {
                                label: '调试工具',
                                accelerator: 'Ctrl+D',
                                click: () => {
                                    this.mainWindow.webContents.toggleDevTools();
                                },
                            },
                        ]
                        : [],
            },
            {
                label: '视图',
                submenu: [
                    {
                        label: this.mainWindow.isFullScreen() ? '&窗口化' : '&全屏',
                        accelerator: 'F11',
                        click: () => {
                            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                        },
                    },
                    {
                        label: '&最小化',
                        accelerator: 'Ctrl+M',
                        click: () => this.mainWindow.minimize()
                    },
                    {
                        label: '&关闭',
                        accelerator: 'Ctrl+W',
                        click: () => this.mainWindow.close()
                    }
                ]
            },
            {
                label: '开源',
                submenu: [
                    {
                        label: 'Github',
                        click() {
                            shell.openExternal(
                                'https://github.com/zhushenwudi/LoveLiveMusicPlayer'
                            );
                        },
                    },
                    {
                        label: '提Bug',
                        click() {
                            shell.openExternal('https://github.com/zhushenwudi/LoveLiveMusicPlayer/issues');
                        },
                    },
                ],
            },
        ];
    }
}
