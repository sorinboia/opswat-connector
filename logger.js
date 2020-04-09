'use strict';

const { createLogger, transports ,format} = require('winston');
const logger = createLogger({
    level: 'info',
    format: format.combine(
        //format.json(),
        format.timestamp(),
        format.prettyPrint(),

    ),
    transports: [
        new transports.Console(),
    ]
});

module.exports = logger;