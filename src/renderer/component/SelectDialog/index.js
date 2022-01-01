import React, {useEffect, useState} from 'react';
import {Button, Select} from "antd";
import Modal from "react-modal";
import './index.css'

const {Option} = Select;

export const SelectDialog = ({isShow, hint, list, result, close}) => {

    const [select, setSelect] = useState()
    const [wait, setWait] = useState(false)

    useEffect(() => {
        if (isShow && list.length > 0) {
            setSelect(list[0].id)
        }
    }, [isShow, list])

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
            height: 'auto',
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

    const renderSelector = () => {
        const arr = []
        list.map((item, index) => {
            arr.push(<Option key={index} value={item.id}>{item.name}</Option>)
        })
        return (
            <Select defaultValue={list[0].name} style={{width: 200, marginBottom: 20}}
                    onChange={value => setSelect(value)}>
                {arr}
            </Select>
        )
    }

    if (isShow) {
        return (
            <Modal
                appElement={document.body}
                isOpen={isShow}
                onAfterOpen={null}
                onRequestClose={close}
                style={modalStyles}>
                <p style={{fontWeight: 'bold', marginBottom: 20}}>{hint}</p>
                {list.length > 0 ? renderSelector() : null}
                <Button
                    type="primary"
                    loading={wait}
                    onClick={() => {
                        setWait(true)
                        result(select)
                        setTimeout(() => {
                            setWait(false)
                            close()
                        }, 1000)
                    }}
                >
                    确定
                </Button>
            </Modal>
        )
    } else return null
}
