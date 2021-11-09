import axios from 'axios';

axios.defaults.adapter = require('axios/lib/adapters/xhr');

export default axios;
