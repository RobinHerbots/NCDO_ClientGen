#!/usr/bin/env node
var cg = require('../lib/clientgen'),
    path = require('path');


if (process.argv[2] !== undefined) {
    var catalogUrl = process.argv[2],
        outputpath = process.argv[3] || process.cwd(),
        noclean = process.argv[4] || false;

    outputpath = path.relative(process.cwd(), outputpath);

    cg(catalogUrl, outputpath, noclean).then(function (data) {
        console.log(data);
    }).error(function (data) {
        console.log(data);
    });
} else {
    console.log("usage: ncdo_clientgen <catalogUrl> [<outputPath>, <noclean>] ");
}

