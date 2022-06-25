import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {Button, List} from "antd";
import Modal from "react-modal";

export const DownloadDialog = forwardRef(({isShow, onClose}, ref) => {

    const [downloadList, setDownloadList] = useState([])
    const [progress, setProgress] = useState({})

    useImperativeHandle(ref, () => ({
        setList: (tempList) => {
            setDownloadList([...tempList])
        },
        setProgress: (kv) => {
            setProgress(kv)
        }
    }))

    const downloadStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.60)'
        },
        content: {
            width: 600,
            height: 400,
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

    const renderChildren = (item) => {
        if (progress.musicId !== undefined && item.musicUId === progress.musicId) {
            item.progress = progress.progress
        }
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                paddingLeft: 10,
                paddingRight: 10,
                background: 'orange'
            }}>
                <p style={{width: 400}}>{item.musicName}</p>
                <p style={{width: 80}}>{item.progress}</p>
            </div>
        )
    }

    return (
        <Modal
            appElement={document.body}
            isOpen={isShow}
            onAfterOpen={null}
            style={downloadStyles}>
            <p style={{fontWeight: 'bold'}}>传输进度</p>
            <div style={{width: 480, overflow: 'auto', height: 300, marginTop: 20, marginBottom: 20}}>
                <List
                    itemLayout="horizontal"
                    dataSource={downloadList}
                    renderItem={renderChildren}
                />
            </div>
            <Button type="primary" onClick={onClose}>停止传输</Button>
        </Modal>
    )
})
