const express = require('express');
const uuidv4 = require('uuid').v4;
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

    const id = uuidv4();

    logger.info(`<${id}> url:${req.url} xff:${req.headers['x-forwarded-for']} client_ip:${req.connection.remoteAddress}`);

    if (!req.file) {
        res.send({"err":"no_file","data":{"uploaded": false,"s3id": null,"name": originalname}});
        logger.error(`<${id}> no file posted`);
        return;
    }

    let stopExec = 0;

    const originalname = req.file.originalname;
    const encoded_originalname = encodeURIComponent( req.file.originalname);
    const opswat = new Opswat({filename: encoded_originalname, fileBuffer:req.file.buffer});

    logger.info(`<${id}> filename:${encoded_originalname}`);

    await opswat.uploadFile({buf:req.file.buffer})
        .catch((err) => {
            logger.error(`<${id}> opswat ${err}`);
            res.status(500).send({"err":"fail1","data":{"uploaded": false,"s3id": null,"name": originalname}});
            stopExec = 1;
        });

    if (stopExec) return;

    const scan = opswat.data.scan;

    logger.info(`<${id}> status:${scan.status} sanitized_url:${scan.sanitized_url}`);


    if (scan.status === 'Allowed') {

        if (!scan.sanitized_url) {
            res.send({ "err": "fail3","data": {"uploaded": false,"s3id": null,"name": originalname}})
            logger.info(`<${id}> Allowed but not sanitized`);
            return;
        }

        const options = {
            originalName: originalname,
            url: req.url,
            fileLocation: scan.sanitized_url,
            opswatAxios: opswat.axios
        };

        const result = await backend.uploadFile(options)
            .catch((err) => {
                logger.error(`<${id}> backend ${err}`);
                res.status(500).send({"err":"fail4","data":{"uploaded": false,"s3id": null,"name": originalname}});
            });
        if(result) {
            logger.info(`<${id}> uploaded to backend`);
            res.send(result.data);
        }

    } else {
        res.send({"err":"fail2","data":{"uploaded": false,"s3id": null,"name": originalname}});
    }
});

app.use(function (err, req, res, next) {
    //logger.error(err);
    res.status(500).send(err);
});


app.listen(port, () => logger.info('App started',config));



