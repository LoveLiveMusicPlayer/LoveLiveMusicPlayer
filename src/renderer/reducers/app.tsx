import * as TYPES from './types';

const initialState = {
    appVersion: "1.0.0"
}

export default function reducer(state = initialState, action: any) {
    switch (action.type) {
        // 记录APP当前版本号
        case TYPES.APP_VERSION:
            return {
                ...state,
                appVersion: action.appVersion
            }
        default:
            return state;
    }
}
