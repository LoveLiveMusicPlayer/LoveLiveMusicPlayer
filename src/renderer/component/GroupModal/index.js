import React from 'react';
import * as Images from "../../public/Images";
import './index.css'
import {Const} from "../../public/Const";
import { MENU_BLUEBIRD, MENU_MUSICAL } from '../../public/Images';

export const GroupModal = ({showCategory, showMenu, chooseGroup, closeModel}) => {

    return (
        <>
            {
                showMenu ?
                    <div className={["move_tile"].join(' ')}>
                        <img src={Images.ICON_TILE} height={'550px'} onClick={closeModel}/>
                    </div> : null
            }
            {
                showCategory ?
                    <div className={"move_category"}>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_COMBINE} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.combine.key)}/>
                            <span className={"menu_category_span"}>{Const.combine.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_MUSICAL} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.musical.key)}/>
                            <span className={"menu_category_span"}>{Const.musical.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_HASUNOSORA} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.hasunosora.key)}/>
                            <span className={"menu_category_span"}>{Const.hasunosora.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_NIJI} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.saki.key)}/>
                            <span className={"menu_category_span"}>{Const.saki.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_MIUSI} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.us.key)}/>
                            <span className={"menu_category_span"}>{Const.us.value}</span>
                        </div>

                        <div className={["hvr-grow", "menu_category"].join(' ')} style={{visibility: 'hidden'}}>
                            <img src={Images.MENU_YOHANE} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.yohane.key)}/>
                            <span className={"menu_category_span"}>{Const.yohane.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_BLUEBIRD} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.bluebird.key)}/>
                            <span className={"menu_category_span"}>{Const.bluebird.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_YOHANE} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.yohane.key)}/>
                            <span className={"menu_category_span"}>{Const.yohane.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_LIELLA} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.liella.key)}/>
                            <span className={"menu_category_span"}>{Const.liella.value}</span>
                        </div>
                        <div className={["hvr-grow", "menu_category"].join(' ')}>
                            <img src={Images.MENU_AQOURS} width={'170px'} height={'250px'}
                                 onClick={() => chooseGroup(Const.aqours.key)}/>
                            <span className={"menu_category_span"}>{Const.aqours.value}</span>
                        </div>
                    </div> : null
            }
        </>
    )
}
