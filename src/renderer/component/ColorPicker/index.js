import React, {forwardRef, useImperativeHandle, useState} from 'react';
import ReactColorPicker from '@super-effective/react-color-picker';
import Modal from "react-modal";
import {Button, Switch} from "antd";
import Store from "../../utils/Store";
import Bus from "../../utils/Event";

export const ColorPicker = forwardRef((props, ref) => {

    const [color1, setColor1] = useState('#3cd6bf');
    const [color2, setColor2] = useState('#3cd6bf');
    const [showColorPicker, setShowColorPicker] = useState(false)

    useImperativeHandle(ref, () => ({
        open: (colors) => {
            if (colors) {
                setColor1(colors.color1)
                setColor2(colors.color2)
            }
            setShowColorPicker(true)
        }
    }))

    const onColorChange1 = (updatedColor) => {
        setColor1(updatedColor);
    };

    const onColorChange2 = (updatedColor) => {
        setColor2(updatedColor);
    };

    const renderColorPicker1 = () => {
        return (
            <ReactColorPicker
                color={color1}
                onChange={onColorChange1}
            />
        )
    }

    const renderColorPicker2 = () => {
        return (
            <ReactColorPicker
                color={color2}
                onChange={onColorChange2}
            />
        )
    }

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
            width: 830,
            height: 400,
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
            marginBottom: 20,
            transform: 'translate(-50%, -50%)',
        },
    };

    const onChooseColorFinish = () => {
        setShowColorPicker(false)
        props?.onChangeColor && props.onChangeColor(color1, color2)
    }

    return (
        <Modal
            appElement={document.body}
            isOpen={showColorPicker}
            onAfterOpen={null}
            onRequestClose={() => setShowColorPicker(false)}
            style={customStyles}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row',
                flexGrow: 1,
                width: '100%',
                justifyContent: 'center'
            }}>
                {renderColorPicker1()}
                <div>{"——"}</div>
                <div>{"\>"}</div>
                {renderColorPicker2()}
            </div>

            <div style={{
                width: '100%',
                height: '70px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end'
            }}>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <Switch
                        onChange={(checked) => {
                            Store.set("glasstron", checked)
                            Bus.emit('onNotification', '设置将在重启后生效')
                        }}
                        defaultChecked={Store.get("glasstron")}
                    />
                    <p style={{marginLeft: '12px'}}>启用窗口模糊？</p>
                </div>

                <Button
                    type="primary"
                    onClick={onChooseColorFinish}
                >
                    确定
                </Button>
            </div>
        </Modal>
    )
})
