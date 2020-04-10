const express = require('express');
const logger = require('./logger');
const multer  = require('multer');
const fs = require('fs');

const filesFolder = './not_scanned_files/';


const upload = multer({ dest:  filesFolder});

const opswat = new (require('./opswat'))({
    domain: 'http://vault.bulwarx.com:8008',
    filesLocation: './not_scanned_files/'
});

const backend = new (require('./backend'))({
    server: 'https://www.menoramivt.co.il',
    filesLocation: './not_scanned_files/'
});


const app = express();
const port = 3000;



app.post('/*',upload.single('file'), async (req, res) => {

    console.log(req.file,req.body);

    const { filename, originalname } = req.file;

    logger.info(`<${filename}>Req Url:${req.url} ${originalname}`);

    const scan = await opswat.uploadFile({fileName: filename})
        .catch((err) => {
            logger.error(err);
            res.send(err);
        });
    logger.info(`<${filename}>scan`);
    switch (scan.status) {
        case 'Allowed':
            const options = {
                fileName: filename,
                originalName: originalname,
                url: req.url
            };

            if (scan.sanitized_url) options.fileLocation = scan.sanitized_url;
            const result = await backend.uploadFile(options);
            logger.info(`<${filename}>result.data `);
            res.send(result.data);
            break;
        case 'Blocked':
        case 'Retry_limit':
            res.send({"uploaded": false,"s3id": null,"name": originalname});
            break;
    }



    opswat.deleteFromQueue({data_id:scan.data_id});
    fs.unlinkSync(`${filesFolder}${filename}`);
});

app.use(function (err, req, res, next) {
    //logger.error(err);
    res.status(500).send(err);
});


app.listen(port, () => console.log(`Application Started on port ${port}`));



