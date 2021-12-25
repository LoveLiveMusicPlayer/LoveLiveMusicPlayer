import {app} from "electron";
import path from "path";

const Store = require('electron-store');

Store.initRenderer();

require('@electron/remote/main').initialize()

export const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../../assets');

export default function () {

    app.commandLine.appendSwitch("--disable-http-cache")
    app.commandLine.appendSwitch('wm-window-animations-disabled')

    if (process.env.NODE_ENV === 'production') {
        const sourceMapSupport = require('source-map-support');
        sourceMapSupport.install();
    }

    const isDevelopment =
        process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

    if (isDevelopment) {
        require('electron-debug')();
    }
}
