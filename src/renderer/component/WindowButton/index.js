import React, {useState} from 'react'

const {ipcRenderer} = require('electron')

export const WindowButton = ({type}) => {

    const [onHover, setOnHover] = useState(false)

    const style = {
        close: {
            width: 13,
            height: 13,
            marginLeft: 7,
            backgroundColor: '#FF565B',
            borderRadius: '50%',
            cursor: 'pointer'
        },
        min: {
            width: 13,
            height: 13,
            marginLeft: 7,
            backgroundColor: '#FFB943',
            borderRadius: '50%',
            cursor: 'pointer'
        },
        max: {
            width: 13,
            height: 13,
            marginLeft: 7,
            backgroundColor: '#1BC94D',
            borderRadius: '50%',
            cursor: 'pointer'
        }
    };

    return (
        <div
            style={Object.assign(style[type], {opacity: onHover ? 1 : 0.6})}
            onClick={() => ipcRenderer.send(type)}
            onMouseOver={() => setOnHover(true)}
            onMouseOut={() => setOnHover(false)}
        />
    )
}
