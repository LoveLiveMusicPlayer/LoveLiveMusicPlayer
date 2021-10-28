import React, {forwardRef, useImperativeHandle, useState} from "react";
import * as Images from "../../public/Images";
import Modal from 'react-modal';

export const Loading = forwardRef((props, ref) => {

    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)

    const customStyles = {
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
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translate(-50%, -50%)',
        },
    };

    useImperativeHandle(ref, () => ({
        setProgress: (progress) => {
            setProgress(progress)
        },

        show: () => {
            setVisible(true)
        },

        hide: () => {
            setVisible(false)
        }
    }))

    return (
        <Modal
            isOpen={visible}
            onAfterOpen={null}
            onRequestClose={null}
            style={customStyles}>
            <img src={Images.LOADING} style={{width: 150, height: 150}}/>
            <p style={{color: 'black'}}>进度：{progress}%</p>
        </Modal>
    )
})
