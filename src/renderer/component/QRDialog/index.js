import React, {useEffect, useState} from 'react';
import {Select, Space} from "antd";
import Modal from "react-modal";
import ip from "ip";
import QRCodeCanvas from "qrcode.react";
import os from "os";
import * as Images from "../../public/Images";

const {Option} = Select;

export const QRDialog = ({isShow, close}) => {

    const [netArr, setNetArr] = useState([])
    const [domain, setDomain] = useState("暂无网络")

    useEffect(() => {
        const interfaces = os.networkInterfaces();
        const netList = []
        for (const inter in interfaces) {
            if (inter.indexOf("VMware") === -1) {
                const address = ip.address(inter)
                if (address !== "127.0.0.1") {
                    netList.push(address)
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
            console.log(address)
            viewList.push(<Option value={index}>{address}</Option>)
        })
        return viewList
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
                        <img src={Images.LOADING} width={180} height={180}/> : <QRCodeCanvas
                            value={domain}
                            size={180}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"L"}
                            includeMargin={false}/>
                }
                <Select
                    defaultValue={domain}
                    style={{width: 150}}
                    bordered={false}
                    disabled={netArr.length <= 1}
                    onChange={(address) => setDomain(address)}
                >
                    {renderChildren()}
                </Select>
            </Space>
        </Modal>
    )
}
