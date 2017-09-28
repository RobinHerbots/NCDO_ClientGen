var Promise = require("bluebird"),
    http = require('http'),
    url = require('url'),
    generateServiceClient = require("./dotnet/GenerateServiceClient");


module.exports = function (catalogUrl, path) {
    catalogUrl = url.parse(catalogUrl);

    return new Promise(function (resolve, reject) {
        if (!catalogUrl) {
            reject('Catalog url required.');
        }

        var catalog;
        http.get({
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
                for (var sndx in catalog.services) {
                    generateServiceClient(catalog.services[sndx], path);
                }
                // console.log(JSON.stringify(catalog));
                resolve("done.");
            });
        }).on("error", function (err) {
            console.log("Error: " + err.message);
            resolve("done.");
        });
    });
};