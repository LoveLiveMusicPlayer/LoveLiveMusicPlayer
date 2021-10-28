const {contextBridge, ipcRenderer} = require('electron');

const ADD_ONE_MUSIC = "addOneMusic"
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        myPing() {
            ipcRenderer.send('ipc-example', 'ping');
        },
        addOneMusic(path) {
            ipcRenderer.send(ADD_ONE_MUSIC, path)
        },
        on(channel, func) {
            const validChannels = ['ipc-example', ADD_ONE_MUSIC];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        once(channel, func) {
            const validChannels = ['ipc-example'];
            if (validChannels.includes(channel)) {
                ipcRenderer.once(channel, (event, ...args) => func(...args));
            }
        },
    },
});
