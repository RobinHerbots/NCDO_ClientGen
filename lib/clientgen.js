var Promise = require("bluebird"),
    http = require('http'),
    https = require('https'),
    fs = require("fs"),
    url = require('url'),
    generateServiceClient = require("./dotnet/generateServiceClient");


module.exports = function (catalogUrl, path, noclean, framework) {
    catalogUrl = url.parse(catalogUrl);

    return new Promise(function (resolve, reject) {
        if (!catalogUrl) {
            reject('Catalog url required.');
        }

        var catalog;
        if (catalogUrl.protocol.indexOf("http") !== 0) {
            fs.readFile(catalogUrl.href, 'utf8', (err, body) => {
                if (err) {
                    console.log("Error: " + err.message);
                    resolve("done.");
                } else {
                    catalog = JSON.parse(body);
                    for (var sndx in catalog.services) {
                        generateServiceClient(catalog.services[sndx], path, catalogUrl, noclean, framework);
                    }
                    resolve("done.");
                }
            });
        } else {
            (catalogUrl.protocol === "https:" ? https : http).get({
                host: catalogUrl.hostname,
                path: catalogUrl.path,
                port: catalogUrl.port
            }, function (response) {
                // Continuously update stream with data
                var body = '';
                response.on('data', function (d) {
                    body += d;
                });
                response.on('end', function () {
                    catalog = JSON.parse(body);
                    generateServiceClient(catalog, path, catalogUrl, noclean, framework);
                    resolve("done.");
                });
            }).on("error", function (err) {
                console.log("Error: " + err.message);
                resolve("done.");
            });
        }
    });
};