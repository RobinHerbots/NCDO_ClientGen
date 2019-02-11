#!/usr/bin/env node
var cg = require('../lib/clientgen'),
    path = require('path');


if (process.argv[2] !== undefined) {
    var catalogUrl = process.argv[2],
        output = process.cwd(),
        noclean = false,
        framework,
        bearer;

    for (var i = 3; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case "--output":
                output = process.argv[i + 1];
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
                bearer = process.argv[i + 1];
                i++;
                break;
        }
    }

    output = path.relative(process.cwd(), output);

    console.log(`catalogUrl: ${catalogUrl}`);
    console.log(`output: ${output}`);
    console.log(`noclean: ${noclean}`);
    console.log(`framework: ${framework}`);
    console.log(`bearer: ${bearer}`);

    cg(catalogUrl, output, noclean, framework, bearer).then(function (data) {
        console.log(data);
    }).error(function (data) {
        console.log(data);
    });
} else {
    console.log("ncdo_clientgen <catalogUrl> [options]");
    console.log("options:");
    console.log("       --output : output path for the client");
    console.log("       --noclean : do not clear the current generated project");
    console.log("       --framework : specify target framework (ex. netstandard20, net472, net461)");
    console.log("       --bearer : token to pass in the Authorization header to access the catalog (if secured)");
}

