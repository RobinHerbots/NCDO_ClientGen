var fs = require("fs"),
    xmlBuilder = require('xml2js').Builder,
    parseString = require('xml2js').parseString;

function addEmbeddedResource(csproj, resourceName) {
    console.log(`Add embedded resource in ${csproj}`);
    var projData = fs.readFileSync(csproj, 'utf-8');
    parseString(projData, function (err, csprojJson) {
        if (err) console.log(err);
        csprojJson.Project.ItemGroup.push({EmbeddedResource: [{$: {Include: `${resourceName}`}}]});
        var builder = new xmlBuilder();
        var csProjXml = builder.buildObject(csprojJson);
        console.log(`writing ${csproj}`);
        fs.writeFileSync(csproj, csProjXml, function (err, data) {
            if (err) console.log(err);
        });
    });
}

module.exports = {addEmbeddedResource: addEmbeddedResource}