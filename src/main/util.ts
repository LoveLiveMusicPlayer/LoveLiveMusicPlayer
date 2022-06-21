/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import {URL} from 'url';
import path from 'path';
import * as Sentry from "@sentry/electron";
import {app} from "electron";
import {FileDecoder, StreamDecoder} from "flac-bindings/lib/decoder";
import wav from "wav";
import fs from "fs";

const net = require('net')

let task: any = null

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

// 停止运行前上传使用时长数据
export function upReportOpenTime(global: any) {
    const startTime = global.startTime
    const endTime = new Date().getTime()
    const during = endTime - startTime
    if (during > 100000) {
        Sentry.withScope(scope => {
            scope.setTag("t-during", during)
            scope.setTag("t-beginTime", startTime)
            scope.setTag("t-ceaseTime", endTime)
            Sentry.captureMessage('start-end-during')
        })
    }
    setTimeout(() => {
        app.exit(0)
    }, 1500)
}

// 上传播放歌曲数据
export function upReportPlaySong(reportInfo: any) {
    Sentry.withScope(scope => {
        scope.setTag("t-name", reportInfo.name)
        scope.setTag("t-count", reportInfo.count)
        scope.setTag("t-during", reportInfo.during)
        Sentry.captureMessage("play-song-info")
    })
}


export function doTask(pathDir: string, musicList: Array<any>, phoneSystem: string, runningTag: number, callback?: (message: string) => {}) {
    if (musicList.length <= 0 || runningTag === 0) {
        console.log('queue completed');
        return
    }
    task = makeCancelable(transfer(pathDir, musicList[0], phoneSystem, runningTag))
    const isLast = musicList.length === 1
    task.promise.then((obj: any) => {
        let message
        if (obj.reason == undefined && runningTag === obj.oldRunningTag) {
            message = {
                cmd: "download",
                body: obj.music.musicUId + " === " + isLast
            }
        } else {
            message = {
                cmd: obj.reason,
                body: obj.music.musicUId
            }
        }
        if (callback != null) {
            callback!(JSON.stringify(message))
        }

        musicList.shift()
        if (!isLast) {
            doTask(pathDir, musicList, phoneSystem, runningTag, callback)
        }
    }).catch(() => {
        musicList.shift()
        if (!isLast) {
            doTask(pathDir, musicList, phoneSystem, runningTag, callback)
        }
    })
}

export function stopTask() {
    if (task !== null) {
        task.cancel()
        task = null
    }
}

// 生成可中断的异步任务
export function makeCancelable(promise: Promise<any>) {
    let hasCanceled_ = false;
    const wrappedPromise = new Promise((resolve, reject) => {
        promise.then((val: any) =>
            hasCanceled_ ? reject({isCanceled: true}) : resolve(val)
        );
        promise.catch((error: any) =>
            hasCanceled_ ? reject({isCanceled: true}) : reject(error)
        );
    });
    return {
        promise: wrappedPromise,
        cancel() {
            hasCanceled_ = true;
        },
    };
}

// 处理文件
export function transfer(pathDir: string, music: any, phoneSystem: string, runningTag: number) {
    if (phoneSystem === "ios") {
        const source = (pathDir + music.convertPath.replace(".wav", ".flac"))
        if (fs.existsSync(source)) {
            return flacToWav2(source, runningTag, music)
        }
        return Promise.resolve({music: music, oldRunningTag: runningTag, reason: "文件不存在"})
    } else {
        return Promise.resolve({music: music, oldRunningTag: runningTag, reason: undefined})
    }
}

// flac 格式转换为 wav
export function flacToWav(musicPath: string, runningTag: number, music: any) {
    return new Promise(function (resolve, _) {
        console.log(musicPath)
        const decoder = new FileDecoder({
            file: musicPath,
        })
        decoder.once('data', (chunk) => {
            const encoder = new wav.Writer({
                channels: decoder.getChannels(),
                bitDepth: decoder.getBitsPerSample(),
                sampleRate: decoder.getSampleRate(),
            })

            encoder.write(chunk)

            decoder
                .pipe(encoder)
                .pipe(fs.createWriteStream(musicPath.replace(".flac", ".wav")))
                .on('error', (e: any) => {
                    console.log(e)
                    return Promise.resolve({music: music, oldRunningTag: runningTag, reason: "转换失败"})
                })
        })

        decoder.on('end', () => {
            const name = path.parse(musicPath).name
            console.log("转换完毕: " + name)
            return resolve({music: music, oldRunningTag: runningTag, reason: undefined})
        })
    })
}

export function flacToWav2(musicPath: string, runningTag: number, music: any) {
    return new Promise(function (resolve, _) {
        console.log(musicPath)
        const inputStream = fs.createReadStream(musicPath)
        const decoder = new StreamDecoder({})
        inputStream.pipe(decoder)
        decoder.once('data', (chunk) => {
            const encoder = new wav.Writer({
                channels: decoder.getChannels(),
                bitDepth: decoder.getBitsPerSample(),
                sampleRate: decoder.getSampleRate(),
            })

            encoder.write(chunk)

            decoder
                .pipe(encoder)
                .pipe(fs.createWriteStream(musicPath.replace(".flac", ".wav")))
                .on('error', (e) => {
                    console.log(e)
                    return Promise.resolve({music: music, oldRunningTag: runningTag, reason: "转换失败"})
                })
        })

        decoder.on('end', () => {
            const name = path.parse(musicPath).name
            console.log("转换完毕: " + name)
            return resolve({music: music, oldRunningTag: runningTag, reason: undefined})
        })
    })
}
