var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (schema, clientName, clientPath) {
    function ConvertABLType(ablType) {
        if (ablType) {
            switch (ablType.toUpperCase()) {
                case "DATE":
                case "DATETIME":
                case "DATETIME-TZ":
                    return "DateTime";
                case "DECIMAL":
                    return "decimal";
                case "INT64":
                    return "Int64";
                case "INTEGER":
                    return "int";
                case "LOGICAL":
                    return "bool";
                default:
                    return "string";
            }
        }
        return "string";
    }

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
            `       public ${dsName}()`,
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
            "using System;",
            "using System.ComponentModel;",
            `using NCDO.CDOMemory;`,
            `using NCDO.Extensions;`,
            `namespace ${clientName}.Models.Records`,
            `{`,
            `   public class ${recordName} : CDO_Record`,
            `   {`,

        ];
        for (var rndx in recordSchema) {
            var propObj = recordSchema[rndx];
            if (propObj.semanticType !== "Internal") {
                if (propObj.title !== "") {
                    content.push(`         [DisplayName("${propObj.title}")]`);
                }
                content.push(`         public ${ConvertABLType(propObj.ablType)} ${rndx} => this.Get("${rndx}");`);
            }
        }
        content.push(`   }`);
        content.push(`}`);

        fs.writeFileSync(`${clientPath}${sep}Models${sep}Records${sep}${recordName}.cs`, content.join('\n'));
    }

    for (var pndx in schema.properties) {
        GenDSFromSchema(pndx, schema.properties[pndx])
    }
}