import React from 'react';
import {useHistory} from "react-router-dom";

const {connect} = require('react-redux');

const Album = ({dispatch, chooseGroup}) => {
    let history = useHistory()
    return (
        <div style={{width: '100%', height: '100%', backgroundColor: '#000'}} onClick={() => history.goBack()}>

        </div>
    )
}

function select(store) {
    return {
        chooseGroup: store.music.chooseGroup,
    };
}

export default connect(select)(Album);
