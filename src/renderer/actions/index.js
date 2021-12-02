import {musicAction} from './music'
import {appAction} from './app'

module.exports = {
    ...musicAction,
    ...appAction
}
