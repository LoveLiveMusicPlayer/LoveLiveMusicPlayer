const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        // myPing() {
        //     ipcRenderer.send('ipc-example', 'ping');
        // },
        // once(channel, func) {
        //     const validChannels = ['ipc-example'];
        //     if (validChannels.includes(channel)) {
        //         ipcRenderer.once(channel, (event, ...args) => func(...args));
        //     }
        // },
    },
});
