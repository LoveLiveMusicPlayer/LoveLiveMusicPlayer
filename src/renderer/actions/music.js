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
}
