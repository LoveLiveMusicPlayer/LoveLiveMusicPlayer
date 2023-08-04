import { OSS_URL_HEAD } from './URLHelper';
import Logger from './Logger';

const axios = require("axios").default;

const axiosClient = axios.create({
    OSS_URL_HEAD,
    headers: {
        "Session-Access-Origin": "xxx",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
    },
});

// 请求拦截器
axiosClient.interceptors.request.use(
    function (config) {
        Logger(`Req URL: ${config.url}`);
        return config;
    },
    function (error) {
        Logger(`Req error: ${error}`);
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        Logger(`Resp error: ${error}`);
        return Promise.reject(error);
    }
);

export default axiosClient;
