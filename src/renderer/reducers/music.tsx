import * as TYPES from './types';

const initialState = {
    chooseGroup: "μ's",
}

export default function reducer(state = initialState, action: any) {
    switch (action.type) {
        // 记录选择的企划
        case TYPES.CHOOSE_GROUP:
            return {
                ...state,
                chooseGroup: action.group
            }
        default:
            return state;
    }
}
