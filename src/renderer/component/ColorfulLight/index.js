import React from 'react';
import { WindowButton } from '../WindowButton';

const os = require("os").platform();
export const ColorfulLight = ({visible = true}) => {
    return (
        <div className={'headerFunc'} style={{visibility: visible && os !== 'darwin' ? 'visible' : 'hidden', left: 0}}>
            <WindowButton type={'close'}/>
            <WindowButton type={'min'}/>
            <WindowButton type={'max'}/>
        </div>
    )
}
