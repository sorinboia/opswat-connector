const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const config = require('./config');


class Backend {

    constructor({server,filesLocation}) {
        this.filesLocation = filesLocation ;
        this.server = server;
    }

    async uploadFile({url,fileLocation,fileName,originalName}) {

        const location = fileLocation || this.filesLocation;
        const file = location.indexOf('http') === 0 ?
            (await axios({
                url:location,
                method: 'GET',
                responseType: 'stream'
            })).data
            : fs.createReadStream(location + fileName);

        const form_data = new FormData();
        form_data.append("file", file);
        form_data.append("fileName", originalName);

        const result = await axios({
            method: 'POST',
            url: `${this.server}${url}`,
            headers: {
                "Content-Type": form_data.getHeaders()['content-type']
            },
            data: form_data
        }).catch((err) => {
            console.log(err);
        });
        return result.data;
    }

}


module.exports = new Backend({
    server:config.backend.server,
    filesLocation: config.filesLocation
});