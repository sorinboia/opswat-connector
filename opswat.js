const axios = require('axios');
const logger = require('./logger');
const { opswat } = require('./config');

const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
axiosCookieJarSupport(axios);



class Opswat {
    constructor({filename, fileBuffer}) {
        this.domain = opswat.url;
        this.statusRetry = opswat.statusRetry;
        this.statusInterval = opswat.statusInterval;
        this.data = {
            filename,
            fileBuffer
        };
        this.axios = axios.create({
            jar: new tough.CookieJar(),
            withCredentials: true
        });
    }


    async updateFileStatus() {

        let scan = this.data.scan;

        if (++scan.retry > this.statusRetry)
            return Promise.reject('retry limit reached');


        const status = await this.axios.get( `${this.domain}/${scan.data_id}`);

        scan.status = status.data.process_info.result;
        scan.post_processing = status.data.process_info.post_processing;

        if (scan.post_processing.converted_destination)
            scan.sanitized_url = `${this.domain}/converted/${scan.data_id}`;

    }


    uploadFile() {
        return new Promise(async (res,rej) => {
            let stopExec = 0;

            const result = await this.axios({
                method: 'POST',
                url: this.domain,
                headers: {
                    filename: this.data.filename,
                },
                data: this.data.fileBuffer
            }).catch((err) => {
                rej(`upload to Opswat error ${err}`);
                stopExec = 1;
            });
            if (stopExec) return;


            this.data.scan = {
                data_id: result.data.data_id,
                retry:0,
                status: 'Processing'
            };


            const interval = setInterval(async () => {
                await this.updateFileStatus()
                    .catch((err) => {
                        clearInterval(interval);
                        rej(`updateFileStatus ${err}`);
                    });

                if (this.data.scan.status !== 'Processing') {
                    clearInterval(interval);
                    res();
                }

            },this.statusInterval);
        })

    }


}



module.exports = Opswat;

