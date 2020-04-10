const argv = require('yargs').argv;



let config = {
    filesLocation: './not_scanned_files/'
};

config.opswat = {
    url: argv.opswat || 'http://vault.bulwarx.com:8008/file',
    statusRetry: argv.statusRetry || 24,
    statusInterval: argv.statusInterval || 5000,
};

config.backend = {
    server: argv.backend
};



module.exports = config;
