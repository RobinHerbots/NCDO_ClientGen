var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (resource, clientName, clientPath) {
    var content = [];

    function genOperation(operation) {
        function genParams(operation) {
            var paramStr = "";
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "REQUEST_BODY") {
                    if (paramStr !== "") paramStr += ", ";
                    paramStr += `${param.name.charAt(0) === "d" ? param.name : "string"} ${param.name}`;
                }
            }

            return paramStr;
        }

        function genParams2(operation) {
            var params = [];
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "REQUEST_BODY") {
                    params.push(`              { "${param.name}", ${param.name} },`);
                }
            }

            return params;
        }

        function genResponseParam(operation) {
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "RESPONSE_BODY") {
                    return `<${param.name.charAt(0) === "d" ? param.name : "string"}>`;
                }
            }
            return "";
        }

        function genResponseParam2(operation) {
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "RESPONSE_BODY") {
                    if (param.name.charAt(0) === "d") {
                        return `return new ${param.name}(cdoRequest.Response.Get("${param.name}") as IEnumerable<KeyValuePair<string, JsonValue>>);`;
                    } else {
                        return `return cdoRequest.Response.Get("${param.name}");`;
                    }
                }
            }
            return "";
        }


        var content = [
            `       public async Task${genResponseParam(operation)} ${operation.name}(${genParams(operation)})`,
            "       {",
            `           var paramObj = new JsonObject`,
            `           {`
        ];
        content = content.concat(genParams2(operation));
        content = content.concat([
            `           };`,
            `           ICDORequest cdoRequest = await Invoke("${operation.name}", paramObj);`,
            `           ${genResponseParam2(operation)}`,
            "       }",
        ]);
        return content;
    }

    function genTableRef(tableRef) {
        return `       public ${tableRef} ${tableRef} => _cdoMemory.${tableRef};`;
    }

    function genCDOBase(resource) {
        var schema = resource.schema, dsName, dsTableRefs;
        for (var pndx in schema.properties) {
            dsName = pndx;
            dsTableRefs = schema.properties[pndx].properties;
            break;
        }

        content = content.concat([
            "using System.Collections.Generic;",
            "using System.Json;",
            "using System.Threading.Tasks;",
            "using NCDO.CDOMemory;",
            "using NCDO.Extensions;",
            "using NCDO.Interfaces;",
            `using ${clientName}.Models;`,
            `using ${clientName}.Models.Records;`,
            `using ${clientName}.Models.Tables;`,
            "",
            `namespace ${clientName}.CDO`,
            "{",
            `    public class ${resource.name} : ACloudDataObject<JsonObject, ${dsName}, ${dsName.replace(/^ds/, "tr")}>`,
            "   {",
            `       public ${resource.name}(ICDOSession cDOSession = null, bool autoFill = false) : base("${resource.name}", cDOSession, autoFill)`,
            "       {",
            "       }"
        ]);
        for (var tableRef in dsTableRefs) {
            content = content.concat(genTableRef(tableRef));
        }
        for (var ondx in resource.operations) {
            if (resource.operations[ondx].type === "invoke")
                content = content.concat(genOperation(resource.operations[ondx]));
        }
        content = content.concat([
            "   }",
            "}"
        ]);
    }

    if (resource) {
        genCDOBase(resource);
        console.log(`${clientPath}${sep}CDO${sep}${resource.name}.cs`);
        fs.writeFileSync(`${clientPath}${sep}CDO${sep}${resource.name}.cs`, content.join('\n'));
    }
}