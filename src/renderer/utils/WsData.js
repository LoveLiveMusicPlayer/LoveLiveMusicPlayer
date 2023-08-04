import React, {useEffect} from "react";
import {VersionUtils} from "./VersionUtils";
import Bus from "./Event";

let ws = null

export const WS_Data = React.forwardRef(({connected, phone2pc, pc2phone, finish, stop, closeQR}, ref) => {

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
                            const transVer = VersionUtils.getTransVersion()
                            // 此处为数字和字符串比较，不要用全等
                            const versionNotSame = command["body"] != transVer
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
                        case "connected":
                            if (!verified) {
                                Bus.emit("onNotification", "PC与APP版本不匹配，请前往博客查看")
                                return
                            }
                            connected()
                            break
                        case "phone2pc":
                            const json1 = JSON.parse(command["body"])
                            phone2pc(json1["love"], json1["menu"], json1["isCover"])
                            break
                        case "pc2phone":
                            const json2 = JSON.parse(command["body"])
                            pc2phone(json2["love"], json2["isCover"])
                            break
                        case "finish":
                            finish()
                            break
                        case "stop":
                            stop()
                            break;
                    }
                });

                ws?.on('close', function (event) {
                    console.log('close', event.code, event.reason);
                });
            }
        });

        server.listen(4389);

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
