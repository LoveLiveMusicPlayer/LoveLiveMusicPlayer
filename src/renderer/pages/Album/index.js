import React, {useEffect} from 'react';
import {useHistory} from "react-router-dom";
import {AlbumHelper} from "../../dao/AlbumHelper";

const {connect} = require('react-redux');

const Album = ({dispatch, chooseGroup, location}) => {
    let history = useHistory()

    useEffect(() => {
        AlbumHelper.findOneAlbumById(location.state.id).then(res => {
            console.log(res)
        })
    }, [])

    return (
        <div style={{width: '100%', height: '100%'}}>

        </div>
    )
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
    };
}

export default connect(select)(Album);
