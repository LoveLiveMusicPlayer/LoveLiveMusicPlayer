import React from 'react';
import {Space} from "antd";
import Modal from "react-modal";
import ip from "ip";
import QRCodeCanvas from "qrcode.react";

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
            height: 300,
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
            style={qrStyles}>
            <p style={{fontWeight: 'bold'}}>请使用手机APP扫码进行歌曲传输</p>
            <Space>
                <QRCodeCanvas
                    value={ip.address()}
                    size={150}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    includeMargin={false}/>
            </Space>
        </Modal>
    )
}
