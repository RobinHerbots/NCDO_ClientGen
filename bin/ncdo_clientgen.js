#!/usr/bin/env node
var cg = require('../lib/clientgen'),
    path = require('path');


if (process.argv[2] !== undefined) {
    var catalogUrl = process.argv[2],
        outputpath = process.argv[3] || process.cwd();

    outputpath = path.relative(process.cwd(), outputpath);

    cg(catalogUrl, outputpath).then(function (data) {
        console.log(data);
    }).error(function (data) {
        console.log(data);
    });
} else {
    console.log("usage: ncdo_clientgen <catalogUrl> ");
}

