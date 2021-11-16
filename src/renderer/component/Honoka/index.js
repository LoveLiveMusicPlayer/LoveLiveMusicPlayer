import React from 'react';
import * as Images from "../../public/Images";
import './index.css'

export const Honoka = ({onBabyClick}) => {
    return (
        <div className={"header_baby"}>
            <img className={"anima_tada"}
                 src={Images.ICON_MENU}
                 width={"60rem"}
                 height={"70rem"}
                 onClick={onBabyClick}
            />
        </div>
    )
}
