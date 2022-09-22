import React, {useEffect, useState} from 'react';
import {Select, Space} from "antd";
import Modal from "react-modal";
import ip from "ip";
import QRCodeCanvas from "qrcode.react";
import os from "os";
import * as Images from "../../public/Images";

const {Option} = Select;

export const QRDialog = ({isShow, isSuccess, type, close}) => {

    const [netArr, setNetArr] = useState([])
    const [domain, setDomain] = useState("暂无网络")

    useEffect(() => {
        const interfaces = os.networkInterfaces();
        const netList = []
        for (const inter in interfaces) {
            if (inter.indexOf("VMware") === -1) {
                const address = ip.address(inter)
                if (address !== undefined && address !== "127.0.0.1") {
                    if (address.indexOf("192.168") !== -1) {
                        // 将192.168段的ip放在前面
                        netList.splice(0, 0, address)
                    } else {
                        netList.push(address)
                    }
                }
            }
        }
        if (netList.length > 0) {
            setDomain(netList[0])
        }
        setNetArr([...netList])
    }, [])

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
            width: 500,
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

    const renderChildren = () => {
        const viewList = []
        netArr.forEach((address, index) => {
            viewList.push(<Option key={index} value={index}>{address}</Option>)
        })
        return viewList
    }

    const renderIP = () => {
        if (isSuccess) {
            return <></>
        } else return <Select
            defaultValue={domain}
            style={{width: 150}}
            bordered={false}
            disabled={netArr.length <= 1}
            onChange={(address) => setDomain(netArr[address])}
        >
            {renderChildren()}
        </Select>
    }

    return (
        <Modal
            appElement={document.body}
            isOpen={isShow}
            onAfterOpen={null}
            onRequestClose={close}
            style={qrStyles}>
            <p style={{fontWeight: 'bold'}}>请使用手机APP扫码进行歌曲传输</p>
            <Space style={{display: 'flex', flexDirection: 'column', marginBottom: 20}}>
                {
                    domain === "暂无网络" ?
                        <img src={Images.LOADING} width={180} height={180}/> :
                        <div style={{width: 180, height: 180}}>
                            {
                                isSuccess ?
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <img src={Images.TRANSPORT_SCAN_SUCCESS} width={128} height={128}/>
                                        <br/>
                                        <p>扫描成功</p>
                                        {type === "data" ? <p>请在手机上选择功能按钮</p> : null}
                                    </div> :
                                    <QRCodeCanvas
                                        value={domain}
                                        size={180}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"L"}
                                        includeMargin={false}/>
                            }
                        </div>
                }
                {renderIP()}
            </Space>
        </Modal>
    )
}
