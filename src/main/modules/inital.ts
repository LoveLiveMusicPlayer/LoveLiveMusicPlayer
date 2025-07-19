import { app, crashReporter } from 'electron';
import path from 'path';
import * as Sentry from '@sentry/electron';
// @ts-ignore
import { SENTRY_MINI_DUMP_URL, SENTRY_URL } from '../../renderer/utils/URLHelper';
import { machineId, machineIdSync } from 'node-machine-id';

const Store = require('electron-store');

Store.initRenderer();

require('@electron/remote/main').initialize()

export const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../../assets');

export default function () {
    Sentry.init({dsn: SENTRY_URL});
    Sentry.setTag("sn", machineIdSync(true))
    Sentry.setTag("s-env", process.env.NODE_ENV)
    app.commandLine.appendSwitch("--disable-http-cache")
    app.commandLine.appendSwitch('wm-window-animations-disabled')
    app.commandLine.appendSwitch("enable-transparent-visuals");

    if (process.env.NODE_ENV === 'production') {
        const sourceMapSupport = require('source-map-support');
        sourceMapSupport.install();
    }

    const isDevelopment =
        process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

    if (isDevelopment) {
        require('electron-debug')();
    }

    crashReporter.start({
        productName: "LoveLiveMusicPlayer",
        companyName: "zhushenwudi",
        submitURL: SENTRY_MINI_DUMP_URL,
        extra: {
            "isDev": isDevelopment ? 'yes' : 'no',
            "version": app.getVersion()
        }
    });

    setTimeout(() => {
        // 上报电脑唯一标识
        machineId(true).then(id => {
            Sentry.captureMessage(id)
        })
    }, 1000)
}
