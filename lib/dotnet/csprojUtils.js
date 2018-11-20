var fs = require("fs"),
    xmlBuilder = require('xml2js').Builder,
    parseString = require('xml2js').parseString;

function addEmbeddedResource(csproj, resourceName) {
    fs.readFile(`${csproj}`, 'utf-8', function (err, data) {
        if (err) console.log(err);
        parseString(data, function (err, csprojJson) {
            if (err) console.log(err);
            csprojJson.Project.ItemGroup.push({EmbeddedResource: [{$: {Include: `${resourceName}`}}]});
            var builder = new xmlBuilder();
            var csProjXml = builder.buildObject(csprojJson);

            fs.writeFile(`${csproj}`, csProjXml, function (err, data) {
                if (err) console.log(err);
            })
        });
    });
}

module.exports = {addEmbeddedResource: addEmbeddedResource}