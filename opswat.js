const axios = require('axios');
const fs = require('fs');
const logger = require('./logger');

class Opswat {
    constructor({domain,statusRetry, statusInterval,filesLocation}) {
        this.domain = domain;
        this.statusRetry = statusRetry || 24;
        this.statusInterval = statusInterval || 5000;
        this.filesLocation = filesLocation || './';
        this.queue = {
            statusLocked: 0,
            data: {}
        };

        this.initQueue();
    }


    deleteFromQueue ({data_id}) {
        delete this.queue.data[data_id];
    }

    async updateFilesStatus() {
        if(!this.queue.statusLocked) {
            this.queue.statusLocked = 1;

            let  queue = [];
            for (let i in this.queue.data)
                queue.push(this.queue.data[i]);

            const statusRequests = queue
                .filter( x => x.status === 'Processing')
                .map( (x) => {
                    return axios({
                        method: 'GET',
                        url: `${this.domain}/file/${x.data_id}`
                    });

                });

            const results = await Promise.all(statusRequests);
            const result_status = results.map ( x => x.data);

            result_status.forEach((resp) => {
                const data_id = resp.data_id;
                const entry = this.queue.data[data_id];
                const status = resp.process_info.result;

                entry.retry++;
                entry.status = status;
                entry.post_processing = resp.process_info.post_processing;
            });

            this.queue.statusLocked = 0;

        } else {
            console.log('Status queue locked');
        }
    }


    async processScannedFiles() {

        let  queue = [];
        for (let i in this.queue.data)
            queue.push(this.queue.data[i]);

        for(let i in queue) {
            const scan = queue[i];
            switch(scan.status) {

                case 'Allowed':
                    if (scan.post_processing.converted_destination)
                        scan.sanitized_url = `${this.domain}/file/converted/${scan.data_id}`;
                case 'Blocked':
                    scan.respond.res(scan);
                    break;
                case 'Processing':
                    if (scan.retry > this.statusRetry) {
                        scan.status = 'Retry_limit';
                        scan.respond.rej(scan);
                    }
                    break;
            }
        }
    }



    initQueue() {
        setInterval(async ()=> {
            await this.updateFilesStatus();
            //logger.info(this.queue);
            await this.processScannedFiles();
        },this.statusInterval)
    }


    uploadFile({fileLocation,fileName}) {
        return new Promise (async (res,rej) => {
            const location = fileLocation || this.filesLocation;
            const file = fs.readFileSync(location + fileName);

            const result = await axios({
                method: 'POST',
                url: this.domain + '/file',
                headers: {
                    filename: fileName,
                    //callbackurl: 'http://109.186.2.146:3000/cb'
                },
                data: file
            });



            const data_id = result.data.data_id;

            logger.info(`${fileName} uploaded data_id:${data_id}`);

            this.queue.data[data_id] = {
                data_id,
                filename: fileName,
                retry:0,
                status: 'Processing',
                respond: {
                    res,
                    rej
                }
            };
        });
    }


}



module.exports = Opswat;

