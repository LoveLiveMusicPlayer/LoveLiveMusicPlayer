import React, {useState} from "react";
import {connect} from "react-redux";
import './index.css'
import * as Images from "../../public/Images";
import {useNavigate} from "react-router-dom";

const Transfer = () => {
    let navigate = useNavigate()

    const [transMusicHover, setTransMusicHover] = useState(false)
    const [transDataHover, setTransDataHover] = useState(false)

    return (
        <div className={'transferContainer'}>
            <div className={'transferItemContainer'}>
                <img
                    src={transMusicHover ? Images.TRANSPORT_MUSIC_HOVER : Images.TRANSPORT_MUSIC}
                    width={'250px'}
                    height={'250px'}
                    className={'itemImage'}
                    onClick={() => navigate('/transferMusic', {replace: true})}
                    onMouseOver={() => setTransMusicHover(true)}
                    onMouseOut={() => setTransMusicHover(false)}
                />
                <p className={'itemText'}>{transMusicHover ? "诶嘿嘿~" : "歌曲传输"}</p>
            </div>

            <div className={'transferItemContainer'}>
                <img
                    src={transDataHover ? Images.TRANSPORT_DATA_HOVER : Images.TRANSPORT_DATA}
                    width={'250px'}
                    height={'250px'}
                    className={'itemImage'}
                    onClick={() => navigate('/transferData', {replace: true})}
                    onMouseOver={() => setTransDataHover(true)}
                    onMouseOut={() => setTransDataHover(false)}
                />
                <p className={'itemText'}>{transDataHover ? "丢鼠鼠！" : "数据同步"}</p>
            </div>
        </div>
    )
}

function select(store) {
    return {};
}

export default connect(select)(Transfer);