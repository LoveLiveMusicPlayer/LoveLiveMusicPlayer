import React, { useEffect } from 'react';
import { DBHelper } from '../dao/DBHelper';
import { VersionUtils } from './VersionUtils';
import Bus from './Event';
import Logger from './Logger';

let ws = null

export const WS_Music = React.forwardRef(({
                                              phoneSystem,
                                              ready,
                                              downloading,
                                              downloadSuccess,
                                              downloadFail,
                                              finish,
                                              closeQR
                                          }, ref) => {

    React.useImperativeHandle(
        ref,
        () => ({
            send
        })
    )

    function send(msg) {
        ws?.send(msg)
    }

    useEffect(() => {
        const WebSocket = require('faye-websocket')
        const server = require('http').createServer();
        server.on('upgrade', function (request, socket, body) {
            if (WebSocket.isWebSocket(request)) {
                ws = new WebSocket(request, socket, body);
                let verified = false

                ws?.on('message', function (event) {
                    let command = JSON.parse(event.data)
                    switch (command["cmd"]) {
                        case "version":
                            Logger("into version");
                            const transVer = VersionUtils.getTransVersion()
                            // 此处为数字和字符串比较，不要用全等
                            const versionNotSame = command['body'] != transVer;
                            if (versionNotSame) {
                                Bus.emit("onNotification", "PC与APP版本不匹配，请前往博客查看")
                            }
                            verified = true;
                            const verMsg = {
                                cmd: "version",
                                body: transVer + ""
                            }
                            ws?.send(JSON.stringify(verMsg))
                            if (versionNotSame) {
                                setTimeout(() => {
                                    closeQR()
                                }, 1000)
                            }
                            break
                        case "system":
                            Logger("into system");
                            if (!verified) {
                                Bus.emit("onNotification", "PC与APP版本不匹配，请前往博客查看")
                                return
                            }
                            phoneSystem(command["body"])
                            Logger(`mobile system: ${command["body"]}`)
                            const httpServer = DBHelper.getHttpServer()
                            const portMsg = {
                                cmd: "port",
                                body: httpServer.port + ""
                            }
                            ws?.send(JSON.stringify(portMsg))
                            break
                        case "musicList":
                            Logger("into musicList");
                            ready(JSON.parse(command["body"]))
                            break
                        case "downloading":
                            Logger("into downloading");
                            downloading(command["body"])
                            break
                        case "download success":
                            Logger("into download success");
                            downloadSuccess(command["body"])
                            break
                        case "download fail":
                            Logger("into download fail");
                            downloadFail(command["body"])
                            break
                        case "finish":
                        case "stop":
                            Logger("into finish");
                            finish()
                            break
                    }
                });

                ws?.on('close', function (event) {
                    console.log('close', event.code, event.reason);
                });
            }
        });

        server.listen(4388);

        return () => {
            if (ws != null) {
                ws.close()
                ws = null
            }
            server.close()
        }
    }, [])

    return (
        <></>
    )
})
