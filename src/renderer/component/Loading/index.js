import React, {forwardRef, useImperativeHandle, useState} from "react";
import * as Images from "../../public/Images";
import Modal from 'react-modal';
import {AppUtils} from "../../utils/AppUtils";
import {Progress} from "antd";
import {hidden} from "chalk";

export const Loading = forwardRef((props, ref) => {

    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)
    const [title, setTitle] = useState("加载中..")

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
            overflow: hidden
        },
    };

    useImperativeHandle(ref, () => ({
        setTitle: (title) => {
            setTitle(title)
        },

        setProgress: (progress) => {
            setProgress(progress)
        },

        show: (title) => {
            setProgress(0)
            if (!AppUtils.isEmpty(title)) {
                setTitle(title)
            }
            setVisible(true)
        },

        hide: () => {
            setVisible(false)
        }
    }))

    const renderProgress = (progress) => {
        if (progress == null || progress === 0) {
            return <></>
        }
        return <Progress
            style={{width: 276, paddingTop: 20}}
            strokeColor={{from: '#108ee9', to: '#87d068'}}
            percent={progress}
            strokeWidth={15}
            showInfo={false}
            trailColor={'#eeeeee'}
            strokeLinecap={'round'}
            status="active"
        />
    }

    return (
        <Modal
            appElement={document.body}
            isOpen={visible}
            onAfterOpen={null}
            onRequestClose={null}
            style={customStyles}>
            <img src={Images.LOADING} style={{width: 150, height: 150}} alt={''} draggable={false}/>
            <p style={{color: 'black'}}>{title}</p>
            {renderProgress(progress)}
        </Modal>
    )
})
