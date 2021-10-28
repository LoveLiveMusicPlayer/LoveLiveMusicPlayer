import * as TYPES from './types';

const initialState = {
    chooseGroup: "μ's",
    openSetHttpInput: 0,
}

export default function reducer(state = initialState, action: any) {
    switch (action.type) {
        // 记录选择的企划
        case TYPES.CHOOSE_GROUP:
            return {
                ...state,
                chooseGroup: action.group
            }
        case TYPES.OPEN_HTTP_PORT_INPUT:
            return {
                ...state,
                openSetHttpInput: action.time
            }
        default:
            return state;
    }
}
