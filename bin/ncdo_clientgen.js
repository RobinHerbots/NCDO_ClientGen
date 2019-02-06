#!/usr/bin/env node
var cg = require('../lib/clientgen'),
    path = require('path');


if (process.argv[2] !== undefined) {
    var catalogUrl = process.argv[2],
        outputpath = process.cwd(),
        noclean = false,
        framework,
        bearerToken;

    for (var i = 3; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case "--output":
                outputpath = process.argv[i + 1];
                i++;
                break;
            case "--noclean":
                noclean = process.argv[i + 1];
                i++;
                break;
            case "--framework":
                framework = process.argv[i + 1];
                i++;
                break;
            case "--bearer":
                bearerToken = process.argv[i + 1];
                i++;
                break;
        }
    }

    outputpath = path.relative(process.cwd(), outputpath);

    cg(catalogUrl, outputpath, noclean, framework, bearerToken).then(function (data) {
        console.log(data);
    }).error(function (data) {
        console.log(data);
    });
} else {
    console.log("ncdo_clientgen <catalogUrl> [options]");
    console.log("options:");
    console.log("       --output : outputpath for the client");
    console.log("       --noclean : do not clear the current generated project");
    console.log("       --framework : specify target framework (ex. netstandard20, net472, net461)");
    console.log("       --bearer : token to pass in the Authorization header to access the catalog (if secured)");
}

