import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {Button, Space} from "antd";
import Modal from "react-modal";

export const CustomDialog = forwardRef((
    {isShow, hint, result, showCancel, cancelText, thirdButton, fourthButton, confirmText, close, bottomContainer}, ref
) => {

    const [wait, setWait] = useState(false)

    useImperativeHandle(ref, () => ({
        forceClose: () => {
            setWait(false)
            close()
        }
    }))

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
            width: 'auto',
            height: 'auto',
            top: '50%',
            left: '50%',
            paddingLeft: '50px',
            paddingRight: '50px',
            paddingBottom: '20px',
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
            onRequestClose={() => {
                if (!wait) {
                    close()
                }
            }}
            style={modalStyles}>
            <p style={{fontWeight: 'bold'}}>{hint}</p>
            <Space size={'large'}>
                {
                    showCancel ?
                        <Button
                            block
                            onClick={() => {
                                result && result(false)
                                close()
                            }}
                        >
                            {cancelText ? cancelText : '取消'}
                        </Button> : null
                }
                {
                    thirdButton ?
                        <Button
                            type="primary"
                            loading={wait}
                            onClick={() => {
                                setWait(true)
                                thirdButton.callback()
                            }}
                        >
                            {thirdButton.text}
                        </Button> : null
                }
                {
                    fourthButton ?
                        <Button
                            type="primary"
                            loading={wait}
                            onClick={() => {
                                setWait(true)
                                fourthButton.callback()
                            }}
                        >
                            {fourthButton.text}
                        </Button> : null
                }
                <Button
                    type="primary"
                    loading={wait}
                    onClick={() => {
                        setWait(true)
                        result && result(true)
                        setTimeout(() => {
                            setWait(false)
                            close()
                        }, 1000)
                    }}
                >
                    {confirmText ? confirmText : '确定'}
                </Button>
            </Space>
            {bottomContainer && bottomContainer()}
        </Modal>
    )
})
