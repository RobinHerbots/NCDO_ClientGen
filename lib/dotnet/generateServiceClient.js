var fs = require("fs"),
    sep = require('path').sep,
    child_process = require('child_process'),
    rimraf = require("rimraf"),
    generateSession = require("./generateSession"),
    generateSchema = require('./generateSchema').generateSchema,
    generateDD = require('./generateSchema').generateDD,
    generateCDO = require("./generateCDO");

module.exports = function (service, path, catalogUrl, noclean) {
    var clientName = `${service.name}Client`,
        clientPath = `${path}${sep}${clientName}`;

    function setupClassLibrary() {
        if (noclean === false) {
            //cleanup
            rimraf.sync(clientPath);
        }
        child_process.execSync(`dotnet new classlib --name ${clientName} --output ${clientPath} --force`, function (error, stdout, stderr) {
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
                    return;
                }

                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
            }
        );
        //add System.ComponentModel.DataAnnotations nuget ref
        child_process.execSync(`dotnet add ${clientPath}${sep}${clientName}.csproj package System.ComponentModel.Annotations`, function (error, stdout, stderr) {
                if (error) {
                    console.error("exec error: " + error);
                    return;
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
    }

    setupClassLibrary();
    if (service) {
        generateSession(service, clientName, clientPath, catalogUrl);
        for (var rndx in service.resources) {
            generateSchema(service.resources[rndx].schema, clientName, clientPath);
            generateDD(service.resources[rndx].dataDefinitions, clientName, clientPath);
            generateCDO(service.resources[rndx], clientName, clientPath);
        }
    }
}