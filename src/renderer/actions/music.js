import * as TYPES from '../reducers/types';

export const musicAction = {
    chooseGroup(group) {
        return (dispatch) => {
            dispatch({
                type: TYPES.CHOOSE_GROUP,
                group
            })
        }
    },
    playId(playId) {
        return (dispatch) => {
            dispatch({
                type: TYPES.PLAY_ID,
                playId
            })
        }
    },
    albumId(albumId) {
        return (dispatch) => {
            dispatch({
                type: TYPES.ALBUM_ID,
                albumId
            })
        }
    }
}
