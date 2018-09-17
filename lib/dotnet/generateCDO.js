var fs = require("fs"),
    sep = require('path').sep,
    DDS = require('./generateSchema').DDS;

module.exports = function (resource, clientName, clientPath) {
    var content = [];

    function genOperation(operation) {
        function genParams(operation) {
            var paramStr = "";
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "REQUEST_BODY") {
                    if (paramStr !== "") paramStr += ", ";

                    if (DDS.DS.indexOf(param.name) !== -1)
                        paramStr += `${param.name} ${param.name}`;
                    else if (DDS.TT.indexOf(param.name) !== -1)
                        paramStr += `${param.name} ${param.name}`;
                    else
                        paramStr += `string ${param.name}`;
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
            var responseParams = [];
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "RESPONSE_BODY") {
                    if (DDS.DS.indexOf(param.name) !== -1)
                        responseParams.push(`${param.name} ${param.name}`);
                    else if (DDS.TT.indexOf(param.name) !== -1)
                        responseParams.push(`${param.name} ${param.name}`);
                    else
                        responseParams.push(`string ${param.name}`);
                }
            }

            if (responseParams.length > 1)
                return `<(${responseParams.join(", ")})>`;
            else if (responseParams.length === 1)
                return `<${responseParams.join("").split(" ")[0]}>`;
            return "";
        }

        function genResponseParam2(operation) {
            var responseParams = [];
            for (var paramNdx in operation.params) {
                var param = operation.params[paramNdx];
                if (param.type === "RESPONSE_BODY") {
                    if (DDS.DS.indexOf(param.name) !== -1)
                        responseParams.push(`new ${param.name}(cdoRequest.Response.Get("${param.name}") as IEnumerable<KeyValuePair<string, JsonValue>>)`);
                    else if (DDS.TT.indexOf(param.name) !== -1)
                        responseParams.push(`new ${param.name}(cdoRequest.Response.Get("${param.name}").Get("${param.name}").Cast<JsonObject>())`);
                    else
                        responseParams.push(`cdoRequest.Response.Get("${param.name}").ToString()`);
                }
            }
            if (responseParams.length > 1)
                return `return (${responseParams.join(", ")});`;
            else if (responseParams.length === 1)
                return `return ${responseParams.join(", ")};`;
            return "return;";
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
            // `           if (cdoRequest.Success.HasValue && cdoRequest.Success.Value)`,
            `           ${genResponseParam2(operation)}`,
            // `           throw new CDOException($"{cdoRequest.ResponseMessage.StatusCode} - {cdoRequest.ResponseMessage.RequestMessage.RequestUri}");`,
            "       }",
        ]);
        return content;
    }

    function genTableRef(tableRef) {
        return `       public ${tableRef} ${tableRef} => _cdoMemory.${tableRef};`;
    }

    function genCDOBase(resource) {
        var schema = resource.schema, dsName = "CDO_Dataset", trName = "CDO_Record", dsTableRefs;
        if (schema) {
            for (var pndx in schema.properties) {
                dsName = pndx;
                dsTableRefs = schema.properties[pndx].properties;
                for (var tableRef in dsTableRefs) {
                    trName = `tr${tableRef.replace(/^tt/, "")}`;
                    break;
                }
                break;
            }
        }

        content = content.concat([
            "using System.Collections.Generic;",
            "using System.Json;",
            "using System.Linq;",
            "using System.Threading.Tasks;",
            "using NCDO;",
            "using NCDO.Extensions;",
            "using NCDO.Interfaces;",
            `using ${clientName}.Models;`,
            `using ${clientName}.Models.Records;`,
            `using ${clientName}.Models.Tables;`,
            "",
            `namespace ${clientName}.CDO`,
            "{",
            `    public partial class ${resource.name} : ACloudDataObject<JsonObject, ${dsName}, ${trName}>`,
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