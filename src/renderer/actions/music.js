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

    openSetHttpInput(time) {
        return (dispatch) => {
            dispatch({
                type: TYPES.OPEN_HTTP_PORT_INPUT,
                time
            })
        }
    },
}
