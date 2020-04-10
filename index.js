const express = require('express');
const logger = require('./logger');
const fs = require('fs');
const Opswat = require('./opswat');
const backend = require('./backend');
const config  = require('./config');


const upload  = (require('multer'))({ dest:  config.filesLocation});


const app = express();
const port = 3000;



app.post('/*',upload.single('file'), async (req, res) => {
    let stopExec = 0;
    const { filename, originalname } = req.file;
    const opswat = new Opswat({filename, originalname});

    logger.info(`<${filename}> url:${req.url} filename:${originalname}`);

    await opswat.uploadFile({fileName: filename})
        .catch((err) => {
            logger.error(`<${filename}> ${err}`);
            res.send({"uploaded": false,"s3id": null,"name": originalname});
            stopExec = 1;
        });

    if (stopExec) return;

    const scan = opswat.data.scan;

    logger.info(`<${filename}> status:${scan.status} sanitized_url:${scan.sanitized_url}`);

    if (scan.status === 'Allowed') {
        const options = {
            fileName: filename,
            originalName: originalname,
            url: req.url
        };

        if (scan.sanitized_url) options.fileLocation = scan.sanitized_url;
        const result = await backend.uploadFile(options);
        logger.info(`<${filename}> uploaded to backend`);
        res.send(result.data);
    } else {
        res.send({"uploaded": false,"s3id": null,"name": originalname});
    }


    fs.unlinkSync(`${config.filesLocation}${filename}`);
});

app.use(function (err, req, res, next) {
    //logger.error(err);
    res.status(500).send(err);
});


app.listen(port, () => logger.info('App started',config));



