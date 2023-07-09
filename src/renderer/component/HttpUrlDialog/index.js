import React, { useRef, useState } from 'react';
import { Button, Divider, Input, InputNumber, Select, Space, Switch } from 'antd';
import Modal from "react-modal";
import Store from "../../utils/Store";
import Bus from '../../utils/Event'

export const HttpUrlDialog = ({isShow, close}) => {

    const [ip, setIp] = useState('')
    const [port, setPort] = useState(10000)

    const [numAble, setNumAble] = useState(true)

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
            height: 160,
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

    const onChange = (checked) => {
        setNumAble(checked)
    };

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
                    placeholder={"网络IP地址"}
                    addonBefore="http://"
                    onChange={(e) => setIp(e.target.value)}
                />
                <Divider/>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32}}>
                    <InputNumber
                        min={10000}
                        max={65535}
                        value={port}
                        disabled={!numAble}
                        onChange={setPort}
                    />
                    <Switch defaultChecked onChange={onChange} style={{marginTop: 10}}/>
                </div>
                <Button
                    type="primary"
                    disabled={ip.length === 0}
                    onClick={() => {
                        if (numAble) {
                            Store.set('url', `http://${ip}:${port}/`)
                        } else {
                            Store.set('url', `http://${ip}/`)
                        }
                        close()
                    }}
                >
                    确定
                </Button>
            </Space>
        </Modal>
    )
}
