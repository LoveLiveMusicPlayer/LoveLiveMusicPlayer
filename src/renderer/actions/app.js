import * as TYPES from '../reducers/types';

export const appAction = {
    appVersion(appVersion) {
        return (dispatch) => {
            dispatch({
                type: TYPES.APP_VERSION,
                appVersion
            })
        }
    }
}
