import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import https from 'https';
import { VersionUtils } from '../../renderer/utils/VersionUtils';
import { Dialog } from './dialog';
import { Config } from '../../common/config';

const myApp = global as any;

export default class update {
    private callback: Function[] | undefined;
    private isSuccess = false;

    constructor() {
        autoUpdater.autoDownload = false;
        this.initListener();
    }

    printLog(message: string) {
        if (myApp.isDebug) {
            myApp.mylog.debug(message);
        } else {
            console.log(message);
        }
    }

    initListener() {
        // https://www.electron.build/auto-update#events
        // https://electronjs.org/docs/api/auto-updater#autoupdaterquitandinstall
        autoUpdater.on('update-downloaded', _info => {
            this.printLog('update-downloaded');
            this.callback && this.callback.length > 0 && this.callback[2].call(this);
            myApp.updateWindow.hide();
            myApp.mainWindow.show();
            Dialog({
                type: 'info',
                message: '已更新完成，请重启应用',
                buttons: ['确定']
            }).then(_ => {
                this.isSuccess = true;
                autoUpdater.quitAndInstall(true, true);
            });
        });

        autoUpdater.on('error', _info => {
            this.printLog('update-error');
            if (!this.isSuccess) {
                this.callback && this.callback.length > 0 && this.callback[2].call(this);
                myApp.updateWindow.hide();
                myApp.mainWindow.show();
                Dialog({ type: 'error', message: '更新失败，请稍后重试' });
            }
        });

        autoUpdater.on('download-progress', _progressObj => {
            this.callback && this.callback.length > 0 && this.callback[1].call(this, JSON.stringify(_progressObj));
        });
    }

    checkUpdate(callbacks: Function[]) {
        this.callback = callbacks;
        // 这里先拉取更新信息，在对话框中显示版本的更新内容
        const checkUpdateUrl = VersionUtils.getVersionInfo();
        this.printLog('Req url: ' + checkUpdateUrl);
        const req = https.request(checkUpdateUrl, req => {
            let message = '';
            req.setEncoding('utf-8');
            req.on('data', chunk => {
                message += chunk.toString();
            });
            req.on('end', () => {
                this.printLog(message);
                const json = JSON.parse(message);
                const localVersion = app.getVersion().split('.').join('');
                const remoteVersion = (Config.isPre ? json.pre.version : json.prod.version).split('.').join('');
                this.printLog(`云端APP版本号：${remoteVersion} 本地APP版本号：${localVersion}`);
                if (localVersion >= remoteVersion) {
                    Dialog({ type: 'info', message: '已经是最新版本了' });
                } else {
                    Dialog({
                        type: 'info',
                        message: `检测到新版本（${json.version}）是否更新`,
                        buttons: ['取消', '确定'],
                        detail: json.message
                    }).then(rtn => {
                        if (rtn.response === 1) {
                            myApp.lyricWindow.hide();
                            myApp.mainWindow.hide();
                            myApp.updateWindow.show();
                            this.callback && this.callback.length > 0 && this.callback[0].call(this);
                            autoUpdater.autoDownload = true;
                            const updateUrl = json.url + '/' + process.platform + '-' + process.arch;
                            this.printLog(`Req url: ${updateUrl}`);
                            autoUpdater.setFeedURL(updateUrl);
                            autoUpdater.checkForUpdates();
                        }
                    });
                }
            });
        });
        req.end();
    }
}
