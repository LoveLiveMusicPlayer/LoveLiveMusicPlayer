const {contextBridge} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {}
});
