import { ipcRenderer } from 'electron';

export default function Logger (message) {
    console.log(message)
    ipcRenderer.send('log', message);
};
