import React, {useState} from 'react';
import {Button, Input, Space} from "antd";
import Modal from "react-modal";
import {AppUtils} from "../../utils/AppUtils";

export const TextDialog = ({isShow, hint, result, close}) => {

    const [text, setText] = useState()
    const [wait, setWait] = useState(false)

    const modalStyles = {
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
            style={modalStyles}>
            <p style={{fontWeight: 'bold'}}>{hint}</p>
            <Space>
                <Input
                    onChange={event => setText(event.target.value)}
                />
                <Button
                    type="primary"
                    loading={wait}
                    disabled={AppUtils.isEmpty(text)}
                    onClick={() => {
                        setWait(true)
                        result(text)
                        setTimeout(() => {
                            setWait(false)
                            close()
                        }, 1000)
                    }}
                >
                    确定
                </Button>
            </Space>
        </Modal>
    )
}
