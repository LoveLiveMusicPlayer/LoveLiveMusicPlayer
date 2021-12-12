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

export const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.log);
};

/**
 * 递归检测端口是否被占用，占用则检测下一个端口
 * @param port
 */
export function portIsOccupied(port: number) {
    // 模拟打开端口查看是否被占用
    const server = net.createServer().listen(port)

    return new Promise((resolve, reject) => {
        // 正常打开端口
        server.on('listening', () => {
            console.log(`port is available`)
            // 关闭端口服务
            server.close()
            // 使用注入进程环境变量的方式进行状态共享
            process.env.DEV_PORT = String(port)
            process.env.PROD_PORT = String(port)
            // 返回可用端口
            resolve(port)
        })

        // 打开端口异常
        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                // 注意这句，如占用端口号+1，当为65535时回到10000端口
                if (port >= 65535) {
                    port = 10000
                } else {
                    port++
                }
                resolve(portIsOccupied(port))
                console.log(`port is unavailable`)
            } else {
                reject(err)
            }
        })
    })
}
