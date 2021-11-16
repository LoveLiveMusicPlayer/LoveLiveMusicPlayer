import React from 'react';
import * as Images from "../../public/Images";
import './index.css'

export const GroupModal = ({showCategory, showMenu, chooseGroup}) => {

    return (
        <>
            {
                showMenu ?
                    <div className={["move_tile"].join(' ')}>
                        <img src={Images.ICON_TILE} height={'550px'}/>
                    </div> : null
            }
            {
                showCategory ?
                    <div className={"move_category"}>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_MIUSI} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("μ's")}/>
                            <span className={"menu_category_span"}>μ's</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_AQOURS} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("Aqours")}/>
                            <span className={"menu_category_span"}>Aqours</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_NIJI} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("Nijigasaki")}/>
                            <span className={"menu_category_span"}>虹咲学园学园偶像同好会</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_LIELLA} width={'250px'} height={'250px'}
                                 onClick={() => chooseGroup("Liella!")}/>
                            <span className={"menu_category_span"}>Liella!</span>
                        </div>
                    </div> : null
            }
        </>
    )
}
