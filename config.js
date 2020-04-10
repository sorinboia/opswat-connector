const argv = require('yargs').argv



let config = {};

config.opswat = {
    url: argv.opswat,
    fileStatusReps: 24,
    fileStatusInterval: 5000
};

config.backend = {

};

module.exports = config;
