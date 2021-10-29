/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import {URL} from 'url';
import path from 'path';
const net = require('net')

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

export function portIsOccupied(port: number) {

    const server = net.createServer().listen(port)

    return new Promise((resolve, reject) => {
        server.on('listening', () => {
            console.log(`port is available`)
            server.close()
            // 使用注入进程环境变量的方式进行状态共享
            process.env.DEV_PORT = String(port)
            process.env.PROD_PORT = String(port)
            // 返回可用端口
            resolve(port)
        })

        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                //注意这句，如占用端口号+1
                resolve(portIsOccupied(port + 1))
                console.log(`port is unavailable`)
            } else {
                reject(err)
            }
        })
    })
}
