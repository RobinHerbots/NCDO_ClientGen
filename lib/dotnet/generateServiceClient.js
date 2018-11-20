var fs = require("fs"),
    sep = require('path').sep,
    child_process = require('child_process'),
    rimraf = require("rimraf"),
    addEmbeddedResource = require("./csprojUtils").addEmbeddedResource,
    generateSession = require("./generateSession"),
    generateSessionOptions = require("./generateSessionOptions"),
    generateSchema = require('./generateSchema').generateSchema,
    generateDD = require('./generateSchema').generateDD,
    generateCDO = require("./generateCDO");

module.exports = function (catalog, path, catalogUrl, noclean, framework) {
    for (var sndx in catalog.services) {
        var service = catalog.services[sndx],
            clientName = `${service.name}Client`,
            clientPath = `${path}${sep}${clientName}`,
            catalogUri = `${clientPath}${sep}${clientName}Catalog.json`;

        function setupClassLibrary() {
            if (noclean === false) {
                //cleanup
                rimraf.sync(clientPath);
            }
            child_process.execSync(
                `dotnet new classlib --name ${clientName} --output ${clientPath} --force`
                + (framework !== undefined ? " --target-framework-override " + framework : ""),
                function (error, stdout, stderr) {
                    if (error) {
                        console.error("exec error: " + error);
                        return;
                    }

                    console.log("stdout: " + stdout);
                    console.log("stderr: " + stderr);
                }
            );
            //add NCDO nuget ref
            child_process.execSync(`dotnet add ${clientPath}${sep}${clientName}.csproj package NCDO`, function (error, stdout, stderr) {
                    if (error) {
                        console.error("exec error: " + error);
                        console.error("Could not reference NCDO.  You will need to reference it manually.")
                    }

                    console.log("stdout: " + stdout);
                    console.log("stderr: " + stderr);
                }
            );
            //delete class.cs from generated project
            fs.unlinkSync(`${clientPath}${sep}Class1.cs`);
            //setup directories
            if (!fs.existsSync(`${clientPath}${sep}CDO`)) {
                fs.mkdirSync(`${clientPath}${sep}CDO`);
            }
            if (!fs.existsSync(`${clientPath}${sep}Models`)) {
                fs.mkdirSync(`${clientPath}${sep}Models`);
            }
            if (!fs.existsSync(`${clientPath}${sep}Models${sep}Tables`)) {
                fs.mkdirSync(`${clientPath}${sep}Models${sep}Tables`);
            }
            if (!fs.existsSync(`${clientPath}${sep}Models${sep}Records`)) {
                fs.mkdirSync(`${clientPath}${sep}Models${sep}Records`);
            }
            fs.writeFileSync(catalogUri, JSON.stringify(catalog));
            addEmbeddedResource(`${clientPath}${sep}${clientName}.csproj`, `${clientName}Catalog.json`);
        }

        setupClassLibrary();
        generateSession(service, clientName, clientPath, `${clientName}.${clientName}Catalog.json`);
        generateSessionOptions(service, clientName, clientPath, catalogUrl);
        //we need 2 passes to make sure all Model types are known before generating the CDO
        for (var rndx in service.resources) {
            generateSchema(service.resources[rndx].schema, clientName, clientPath);
            generateDD(service.resources[rndx].dataDefinitions, clientName, clientPath);
        }
        for (var rndx in service.resources) {
            generateCDO(service.resources[rndx], clientName, clientPath);
        }
    }
}