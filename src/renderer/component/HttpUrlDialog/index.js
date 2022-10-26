import React, {useState} from 'react';
import {Button, Divider, Input, InputNumber, Space} from "antd";
import Modal from "react-modal";
import Store from "../../utils/Store";
import Bus from '../../utils/Event'

export const HttpUrlDialog = ({isShow, close}) => {

    const [ip, setIp] = useState('')
    const [port, setPort] = useState(10000)

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
            width: 500,
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

    const checkRegExp = (str) => {
        let reg = /^(((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))$/
        return reg.test(str)
    }

    return (
        <Modal
            appElement={document.body}
            isOpen={isShow}
            onAfterOpen={null}
            onRequestClose={close}
            style={httpPortStyles}>
            <p style={{fontWeight: 'bold'}}>配置网络地址</p>
            <Space>
                <Input
                    placeholder={"IP HOST"}
                    addonBefore="http://"
                    onChange={(e) => setIp(e.target.value)}
                />
                <Divider/>
                <InputNumber
                    min={10000}
                    max={65535}
                    value={port}
                    onChange={setPort}
                />
                <Button
                    type="primary"
                    disabled={ip.length === 0}
                    onClick={() => {
                        if (!checkRegExp(ip)) {
                            Bus.emit('onNotification', 'IP输入不正确')
                            return
                        }
                        Store.set('url', `http://${ip}:${port}/`)
                        close()
                    }}
                >
                    确定
                </Button>
            </Space>
        </Modal>
    )
}
