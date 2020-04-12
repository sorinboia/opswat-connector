const express = require('express');
const logger = require('./logger');
const Opswat = require('./opswat');
const backend = require('./backend');
const config  = require('./config');

const multer  = require('multer');
const storage = multer.memoryStorage();
const upload  = multer({ storage: storage });


const app = express();
const port = 3000;

app.get('/health', (req,res) => {
   res.send(200);
});

app.post('/*',upload.single('file'), async (req, res) => {
    let stopExec = 0;
    const { originalname } = req.file;
    const opswat = new Opswat({filename: originalname, fileBuffer:req.file.buffer});

    logger.info(`<${originalname}> url:${req.url} filename:${originalname}`);

    await opswat.uploadFile({buf:req.file.buffer})
        .catch((err) => {
            logger.error(`<${originalname}> ${err}`);
            res.send({"err":"fail1","data":{"uploaded": false,"s3id": null,"name": originalname}});
            stopExec = 1;
        });

    if (stopExec) return;

    const scan = opswat.data.scan;

    logger.info(`<${originalname}> status:${scan.status} sanitized_url:${scan.sanitized_url}`);


    if (scan.status === 'Allowed') {

        if (!scan.sanitized_url) {
            res.send({ "err": "fail3","data": {"uploaded": false,"s3id": null,"name": originalname}})
            logger.info(`<${originalname}> Allowed but not sanitized`);
            return;
        }

        const options = {
            originalName: originalname,
            url: req.url,
            fileLocation: scan.sanitized_url
        };

        const result = await backend.uploadFile(options);
        logger.info(`<${originalname}> uploaded to backend`);
        res.send(result.data);
    } else {
        res.send({"err":"fail2","data":{"uploaded": false,"s3id": null,"name": originalname}});
    }
});

app.use(function (err, req, res, next) {
    //logger.error(err);
    res.status(500).send(err);
});


app.listen(port, () => logger.info('App started',config));



