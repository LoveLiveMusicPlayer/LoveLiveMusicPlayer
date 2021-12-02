import * as TYPES from './types';

const initialState = {
    chooseGroup: "μ's",
    playId: '',
    albumId: ''
}

export default function reducer(state = initialState, action: any) {
    switch (action.type) {
        // 记录选择的企划
        case TYPES.CHOOSE_GROUP:
            return {
                ...state,
                chooseGroup: action.group
            }
        // 记录当前播放的歌曲唯一id
        case TYPES.PLAY_ID:
            return {
                ...state,
                playId: action.playId
            }
        // 记录当前播放的专辑唯一id
        case TYPES.ALBUM_ID:
            return {
                ...state,
                albumId: action.albumId
            }
        default:
            return state;
    }
}
