import {dialog, nativeImage} from "electron";
import path from "path";
import {RESOURCES_PATH} from "./inital";

/**
 * 提示框封装组件
 *
 * @param type              提示类型
 * @param title             标题
 * @param message           消息
 * @param detail            详情
 * @param buttons           按钮数组
 * @param icon              显示图标
 * @returns res.response    按钮点击index回调
 * @constructor
 */

interface Data {
    type: string,
    title?: string,
    message: string,
    detail?: string,
    buttons?: string[],
    icon?: string
}

export const Dialog = function (props: Data) {
    let defaultTitle = ""
    switch (props.type) {
        case "info":
            defaultTitle = "提示"
            break
        case "error":
            defaultTitle = "错误"
            break
        case "question":
            defaultTitle = "请示"
            break
        case "warning":
            defaultTitle = "警告"
            break
        default:
            break
    }
    const option: any = {}
    if (props.type) option['type'] = props.type
    option['title'] = checkNull(props.title ? props.title : defaultTitle)
    if (props.message) option['message'] = checkNull(props.message)
    if (props.detail) option['detail'] = checkNull(props.detail)
    option['buttons'] = props.buttons ? props.buttons : ["知道了"]
    option['icon'] = nativeImage.createFromPath(path.join(RESOURCES_PATH, props.icon ? props.icon : 'icons/32x32.png'))
    return dialog.showMessageBox(option)
}

const checkNull = (value?: string): string => {
    if (value === null || value == undefined) {
        return ""
    } else {
        return value
    }
}

export default Dialog
