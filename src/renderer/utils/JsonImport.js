import https from 'https'
import store from "../utils/Store"
import axios from 'axios';

const info = 'https://zhushenwudi1.oss-cn-hangzhou.aliyuncs.com/info.json'

export const JsonImport = {

    async requestUrl() {
        const response = await axios.get(info)
        console.log(response)
        // let message = ''
        // const req = https.request(info, req => {
        //     req.setEncoding('utf-8')
        //     req.on('data', chunk => {
        //         message += chunk.toString()
        //     })
        //     req.on('end', () => {
        //         const json = JSON.parse(message)
        //         this.requestData(json.data)
        //     })
        // })
        // req.end()
    },

    requestData(url) {
        let message = ''
        const req = https.request(url, req => {
            req.setEncoding('utf-8')
            req.on('data', chunk => {
                message += chunk.toString()
            })
            req.on('end', () => {
                const json = JSON.parse(message)
                const version = store.get("dataVersion")
                if (version === undefined || version < json.version) {
                    // store.set("dataVersion", json.version)

                }
            })
        })
        req.end()
    },

    saveData() {
        // try {
        //     loadingRef.current?.show()
        //     const json = fs.readFileSync(path, {encoding: "utf-8"})
        //     AlbumHelper.insertOrUpdateAlbum(json, function (progress) {
        //         loadingRef.current?.setProgress(progress)
        //     }).then(_ => {
        //         setRefresh(new Date().getTime())
        //         setTimeout(() => {
        //             loadingRef.current?.hide()
        //         }, 1000)
        //     })
        // } catch (e) {
        //     loadingRef.current?.hide()
        //     AppUtils.openMsgDialog("error", "导入专辑列表失败")
        // }
    }
}
