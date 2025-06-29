import fs from "fs";
import path from "path";
import { parseFile } from 'music-metadata';
import moment from "moment";
import wav from "wav";

const {ipcRenderer} = require("electron")

const coverArr = []
let lastDir = ""

export const AppUtils = {
    isNull(text) {
        return text === null || text === undefined;
    },

    isEmpty(text) {
        return this.isNull(text) || text === ''
    },

    isNullOrNumber(text, defaultValue) {
        if (text === null || text === undefined) {
            return defaultValue
        } else return text
    },

    showValue(text) {
        if (text) return text
        else return '-'
    },

    /**
     * 遍历文件路径
     * @param dir
     * @param filesList
     * @param splitPath
     * @returns {Promise<void>}
     */
    async readFileList(dir, filesList, splitPath) {
        const files = fs.readdirSync(dir);
        for (const item of files) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                await this.readFileList(fullPath, filesList, splitPath);  //递归读取文件
            } else if (item.endsWith(".flac") && item.toLowerCase().indexOf("off vocal") === -1) {
                filesList.push(fullPath);
            }
        }
    },

    readFile(filePath) {
        return fs.readFileSync(filePath, 'utf-8')
    },

    // map转对象
    _strMapToObj(strMap) {
        let obj = Object.create(null);
        for (let [k, v] of strMap) {
            obj[k] = v;
        }
        return obj;
    },

    // 对象转map
    _objToStrMap(obj) {
        let strMap = new Map();
        for (let k of Object.keys(obj)) {
            strMap.set(k, obj[k]);
        }
        return strMap;
    },

    /**
     * 解析音乐信息
     * @param filesList
     * @param splitPath
     * @returns {Promise<*[]>}
     */
    async parseMusicInfo(filesList, splitPath) {
        coverArr.splice(0, coverArr.length);
        const infoList = []
        for (let i = 0; i < filesList.length; i++) {
            const obj = {}
            const filePath = filesList[i]
            const metadata = await parseFile(filePath)
            const dir = filePath.substring(0, filePath.lastIndexOf(path.sep) + 1)
            obj.pic = this.savePic(dir, metadata.common.picture[0].data).replace(splitPath, '').replaceAll(path.sep, '/')
            obj.title = metadata.common.title
            obj.album = metadata.common.album
            obj.artist = metadata.common.artist
            obj.date = filePath.match(/\[(\S*)]/)[1]
            obj.path = filePath.replace(splitPath, '').replaceAll(path.sep, '/')
            obj.time = this.parseDurationToTime(Math.floor(metadata.format.duration))
            infoList.push(obj)
        }
        return infoList
    },

    parseDurationToTime(duration) {
        const time = moment.duration(duration, 'seconds')
        return moment({m: time.minutes(), s: time.seconds()}).format('mm:ss')
    },

    /**
     * 保存图片
     * @param dir
     * @param data
     * @returns {string}
     */
    savePic(dir, data) {
        let index = 1
        const base64 = this.arrayBufferToBase64(data)
        let hasPic = false
        if (lastDir === dir) {
            coverArr.map(item => {
                if (item === base64) {
                    hasPic = true
                }
            })
            if (!hasPic) {
                index = coverArr.length + 1
            }
        } else {
            coverArr.splice(0, coverArr.length);
        }
        const path = dir + `Cover_${index}.jpg`
        lastDir = dir
        if (!hasPic) {
            fs.writeFileSync(path, data)
            coverArr.push(base64)
        }
        return path
    },

    /**
     * byte数组 转 base64字符串
     * @param buffer
     * @returns {string}
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },

    /**
     * 转存为 txt文件
     * @param json
     * @param saveName
     */
    downloadTxtFile(json, saveName) {
        const blob = new Blob([json], {type: 'text/plain'})
        const blobUrl = URL.createObjectURL(blob); // 创建blob地址
        const element = document.createElement("a");
        element.href = blobUrl;
        element.download = saveName || '';
        let event;
        if (window.MouseEvent) event = new MouseEvent('click');
        else {
            event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        }
        element.dispatchEvent(event);
    },

    /**
     * 删除字符串中最后一个指定字符串
     * @param origin
     * @param delStr
     * @returns {*}
     */
    delLastSameString(origin, delStr) {
        const reverseDelStr = delStr.split('').reverse().join('')
        const reverseOrigin = origin.split('').reverse().join('')
        return reverseOrigin.replace(reverseDelStr, '').split('').reverse().join('')
    },

    encodeURL(url) {
        return encodeURI(url)
            .replaceAll("'", "%27")
            .replaceAll('(', "%28")
            .replaceAll(')', "%29")
    },

    /**
     * 弹出提示窗
     * @param type 弹窗类型 "none", "info", "error", "question", "warning"
     * @param message 消息
     */
    openMsgDialog(type, message) {
        ipcRenderer.send('msgDialog', {type: type, message: message})
    },

    setBodyColor(colors) {
        const alpha = process.platform === "darwin" ? 0.5 : 0.8
        const first = this.hexToRgba(colors.color1, alpha)
        const second = this.hexToRgba(colors.color2, alpha)

        const container = document.getElementsByClassName('outer_container')[0]
        container.style.background = 'linear-gradient(' + 200.96 + 'deg, ' + first.rgba + ', ' + second.rgba + ')';
        document.body.style.background = '#00000000'
    },

    // 返回1..100中，数组内不存在的最小值
    calcSmallAtIntArr(arr) {
        arr = arr.sort()
        let result = -1
        for (let i = 1; i <= 100; i++) {
            if (arr.indexOf(i) === -1) {
                result = i
                break
            }
        }
        return result
    },

    // 颜色取反
    colorReverse(originColor) {
        const old = "0x" + originColor.replace(/#/g, "")
        let str = "000000" + (0xFFFFFF - old).toString(16);
        return str.substring(str.length - 6, str.length);
    },

    // 判断点是否在矩形区域内
    isPointInArea(point, area) {
        const deltaX = point.x - area.left
        const deltaY = point.y - area.top
        return !(deltaX <= 0 || deltaX >= area.right - area.left || deltaY <= 0 || deltaY >= area.bottom - area.top);
    },

    isFile(path) {
        const statObj = fs.statSync(path)
        return statObj.isFile()
    },

    getFileDirectory(mPath) {
        if (fs.existsSync(mPath)) {
            if (this.isFile(mPath)) {
                mPath = mPath.substring(0, mPath.lastIndexOf(path.sep) + 1)
            }
            return mPath
        }
        return null
    },

    getFileName(mPath) {
        if (fs.existsSync(mPath)) {
            if (this.isFile(mPath)) {
                mPath = mPath.substring(mPath.lastIndexOf(path.sep) + 1, path.length)
            }
            return mPath
        }
        return null
    },

    // 递归创建文件夹
    mkdirsSync(dirname) {
        if (fs.existsSync(dirname)) return true;
        if (this.mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    },

    // 删除转换的 wav 文件
    delWavFile(_path, reservePath) {
        if (fs.existsSync(_path)) {
            if (fs.statSync(_path).isDirectory()) {
                let files = fs.readdirSync(_path);
                files.forEach((file) => {
                    let currentPath = _path + "/" + file;
                    if (fs.statSync(currentPath).isDirectory()) {
                        this.delWavFile(currentPath, reservePath);
                    } else if (path.parse(currentPath).ext === "wav") {
                        fs.unlinkSync(currentPath);
                    }
                });
                if (_path !== reservePath) {
                    fs.rmdirSync(_path);
                }
            } else if (path.parse(_path).ext === "wav") {
                fs.unlinkSync(_path);
            }
        }
    },

    // 删除文件
    delFile(path) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    },

    isStrInArray(str, arr) {
        let n = arr.length;
        for (let i = 0; i < n; i++) {
            if (arr[i] === str) {
                return true;
            }
        }
        return false;
    },

    // 将rgb颜色转成hex
    colorRGB2Hex(color) {
        const rgb = color.split(',');
        const r = parseInt(rgb[0].split('(')[1]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2].split(')')[0]);

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    // 将hex颜色转成rgb
    hexToRgba(hex, opacity) {
        const RGBA = "rgba(" + parseInt("0x" + hex.slice(1, 3)) + "," + parseInt("0x" + hex.slice(3, 5)) + "," + parseInt("0x" + hex.slice(5, 7)) + "," + opacity + ")";
        return {
            red: parseInt("0x" + hex.slice(1, 3)),
            green: parseInt("0x" + hex.slice(3, 5)),
            blue: parseInt("0x" + hex.slice(5, 7)),
            rgba: RGBA
        }
    }
}

module.export = AppUtils
