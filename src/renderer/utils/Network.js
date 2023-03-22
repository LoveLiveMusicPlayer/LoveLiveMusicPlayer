import { OSS_URL_HEAD } from './URLHelper';

const axios = require("axios").default;

const axiosClient = axios.create({
    OSS_URL_HEAD,
    headers: {
        "Session-Access-Origin": "xxx",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
    },
});

export default axiosClient;
