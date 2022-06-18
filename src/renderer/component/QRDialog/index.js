import React, {useEffect} from 'react';
import {Button, Space} from "antd";
import Modal from "react-modal";
import QRCode from "qrcode";
import ip from "ip";

export const QRDialog = ({isShow, close}) => {

    const qrStyles = {
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

    useEffect(() => {
        const canvas = document.getElementById('canvas');
        QRCode.toCanvas(canvas, ip.address(), {version: 3, width: 300}, function (error) {
            if (error) console.error(error)
        })
    }, [])

    return (
        <Modal
            appElement={document.body}
            isOpen={isShow}
            onAfterOpen={null}
            onRequestClose={close}
            style={qrStyles}>
            <p style={{fontWeight: 'bold'}}>请使用手机APP扫码进行歌曲传输</p>
            <Space>
                <canvas id="canvas"/>
                <Button type="primary" onClick={close}>关闭</Button>
            </Space>
        </Modal>
    )
}
