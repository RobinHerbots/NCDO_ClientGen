var fs = require("fs"),
    sep = require('path').sep,
    child_process = require('child_process');

module.exports = function (service, path) {
    var clientName = `${service.name}Client`,
        clientPath = `${path}${sep}${clientName}`;

    function SetupClassLibrary() {
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

    function GenerateSchema(schema) {
        function GenDSFromSchema(dsName, dsSchema) {

            for (var pndx in dsSchema.properties) {
                GenTableFromSchema(pndx, dsSchema.properties[pndx])
            }

            var content = [
                `using System.Collections.Generic;`,
                `using System.Json;`,
                `using System.Linq;`,
                `using NCDO.CDOMemory;`,
                `using NCDO.Extensions;`,
                `using ${clientName}.Models.Tables;`,

                `namespace ${clientName}.Models`,
                `{`,
                `   public class ${dsName} : CDO_Dataset`,
                `   {`,
                `       public ${dsName}(IEnumerable<KeyValuePair<string, JsonValue>> items) : base(items)`,
                `       {`,
                `       }`,

                `       public override void ImportTables(JsonValue value)`,
                `       {`
            ];
            for (var pndx in dsSchema.properties) {
                content.push(`            Add("${pndx}", new ${pndx}(((IEnumerable<JsonValue>)value.Get("${pndx}")).Cast<JsonObject>()));`);
            }
            content.push(`       }`);

            for (var pndx in dsSchema.properties) {
                content.push(`       public ${pndx} ${pndx} => (${pndx}) this.Get("${pndx}");`);
            }


            content = content.concat([
                `   }`,
                `}`
            ]);


            fs.writeFileSync(`${clientPath}${sep}Models${sep}${dsName}.cs`, content.join('\n'));
        }

        function GenTableFromSchema(tableName, tableSchema) {

            GenRecordFromSchema(tableName.replace(/^tt/, "tr"), tableSchema.items.properties);
            var content = [
                `using System.Collections.Generic;`,
                `using System.Json;`,
                `using NCDO.CDOMemory;`,
                `using ${clientName}.Models.Records;`,
                `namespace ${clientName}.Models.Tables`,
                `{`,
                `    public class ${tableName} : CDO_Table<trUMAddress>`,
                `    {`,
                `        public ${tableName}(IEnumerable<JsonObject> items) : base(items)`,
                `        {`,
                `        }`,
                `   }`,
                `}`
            ];

            fs.writeFileSync(`${clientPath}${sep}Models${sep}Tables${sep}${tableName}.cs`, content.join('\n'));
        }

        function GenRecordFromSchema(recordName, recordSchema) {
            var content = [
                `using NCDO.CDOMemory;`,
                `namespace ${clientName}.Models.Records`,
                `{`,
                `   public class ${recordName} : CDO_Record`,
                `   {`,
                `   }`,
                `}`
            ];
            fs.writeFileSync(`${clientPath}${sep}Models${sep}Records${sep}${recordName}.cs`, content.join('\n'));
        }

        for (var pndx in schema.properties) {
            GenDSFromSchema(pndx, schema.properties[pndx])
        }
    }

    function GenerateCDO(resource) {
        var content = [];

        function GenOperation(operation) {
            function GenParams(operation) {
                var paramStr = "";
                for (var paramNdx in operation.params) {
                    var param = operation.params[paramNdx];
                    if (param.type === "REQUEST_BODY") {
                        if (paramStr !== "") paramStr += ", ";
                        paramStr += `string ${param.name}`;
                    }
                }

                return paramStr;
            }

            function GenParams2(operation) {
                var params = [];
                for (var paramNdx in operation.params) {
                    var param = operation.params[paramNdx];
                    if (param.type === "REQUEST_BODY") {
                        params.push(`              { "${param.name}", new JsonPrimitive(${param.name}) },`);
                    }
                }

                return params;
            }

            var content = [
                `       public async Task<ICDORequest> ${operation.name}(${GenParams(operation)})`,
                "       {",
                `           var paramObj = new JsonObject`,
                `           {`
            ];
            content = content.concat(GenParams2(operation));
            content = content.concat([
                `           };`,
                `           return await Invoke("${operation.name}", paramObj);`,
                "       }"
            ]);

            return content;
        }

        function GenCDOBase(resource) {
            content = content.concat([
                "using System.Json;",
                "using System.Threading.Tasks;",
                "using NCDO.Interfaces;",
                "",
                `namespace ${clientName}.CDO`,
                "{",
                `    public class ${resource.name} : ACloudDataObject<JsonObject>`,
                "   {",
                `       public ${resource.name}(ICDOSession cDOSession = null, bool autoFill = false) : base("${resource.name}", cDOSession, autoFill)`,
                "       {",
                "       }"
            ]);
            for (var ondx in resource.operations) {
                if (resource.operations[ondx].type === "invoke")
                    content = content.concat(GenOperation(resource.operations[ondx]));
            }
            content = content.concat([
                "   }",
                "}"
            ]);
        }

        GenCDOBase(resource);
        console.log(`${clientPath}${sep}${resource.name}.cs`);
        fs.writeFileSync(`${clientPath}${sep}CDO${sep}${resource.name}.cs`, content.join('\n'));
    }

    SetupClassLibrary();
    for (var rndx in service.resources) {
        GenerateSchema(service.resources[rndx].schema);
        GenerateCDO(service.resources[rndx]);
    }
}