import React, {useState} from 'react';
import {Button, InputNumber, Space} from "antd";
import Modal from "react-modal";

export const PortDialog = ({isShow, rootDir, port, close, setHttpServer, setPort}) => {

    // 设置http端口等待两秒时的按钮状态
    const [wait, setWait] = useState(false)

    const httpPortStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.60)'
        },
        content: {
            width: 300,
            height: 150,
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-around',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translate(-50%, -50%)',
        },
    };

    return (
        <Modal
            appElement={document.body}
            isOpen={isShow}
            onAfterOpen={null}
            onRequestClose={close}
            style={httpPortStyles}>
            <p style={{fontWeight: 'bold'}}>请输入端口号</p>
            <Space>
                <InputNumber
                    min={10000}
                    max={65535}
                    value={port}
                    defaultValue={10000}
                    onChange={setPort}
                />
                <Button
                    type="primary"
                    loading={wait}
                    onClick={() => {
                        if (port < 10000 || port > 65535) {
                            setPort(10000)
                        } else {
                            // 只有在 10000-65535 区间内的端口才允许设置
                            setWait(true)
                            setHttpServer({path: rootDir, port: port})
                            setTimeout(() => {
                                setWait(false)
                                close()
                            }, 2000)
                        }
                    }}
                >
                    确定
                </Button>
            </Space>
        </Modal>
    )
}
