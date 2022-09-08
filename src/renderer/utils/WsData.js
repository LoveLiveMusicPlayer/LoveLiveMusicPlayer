import React, {useEffect} from "react";

let ws = null

export const WS_Data = React.forwardRef(({phone2pc, pc2phone, finish, stop}, ref) => {

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

                ws?.on('message', function (event) {
                    let command = JSON.parse(event.data)
                    switch (command["cmd"]) {
                        case "phone2pc":
                            const json1 = JSON.parse(command["body"])
                            phone2pc(json1["love"], json1["menu"])
                            break
                        case "pc2phone":
                            const json2 = JSON.parse(command["body"])
                            pc2phone(json2["love"])
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
                    // ws = null;
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
