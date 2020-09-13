const axios = require('axios');
const qs = require('querystring');

export const getAuthTokens = async (cb) => {
    // console.log("url", process.env.REACT_APP_WA_OAUTH_URL);
    // console.log("key", process.env.REACT_APP_WA_API_KEY);

    let basicAuthHeader = 'Basic ' + new Buffer('APIKEY:' + process.env.REACT_APP_WA_API_KEY).toString('base64');
    let body = {
        grant_type: 'client_credentials',
        scope: 'auto',
        obtain_refresh_token: true
    };

    // const postConfig = {
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //         'Authorization': basicAuthHeader},
    // }

    await axios({
        method: 'POST',
        url: process.env.REACT_APP_WA_OAUTH_URL,
        data: qs.stringify(body),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': basicAuthHeader},
    })
    // await axios.post(process.env.REACT_APP_WA_OAUTH_URL, qs.stringify(body), postConfig)
        .then( (result) => {
            cb(result.data);
        })
        .catch( (err) => {
            console.log('error', err);
        });
}

