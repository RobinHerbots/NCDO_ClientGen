var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (schema, clientName, clientPath) {
    function convertABLType(ablType) {
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

    function genABLTypeGetter(ablType, propertyName) {
        var getter = [];
        if (ablType) {
            switch (ablType.toUpperCase()) {
                case "DATE":
                    getter.push(`           get => DateTime.TryParseExact(this.Get("${propertyName}"), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue;`);
                    break;
                case "DATETIME":
                    getter.push(`           get => DateTime.TryParseExact(this.Get("${propertyName}"), "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue;`);
                    break;
                case "DATETIME-TZ":
                    getter.push(`           get => DateTime.TryParseExact(this.Get("${propertyName}"), "yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue;`);
                    break;
                case "DECIMAL":
                case "INT64":
                case "INTEGER":
                case "LOGICAL":
                default:
                    getter.push(`           get => this.Get("${propertyName}");`);
            }
        } else getter.push(`           get => this.Get("${propertyName}");`);
        return getter.join("\n");
    }

    function genABLTypeSetter(ablType, propertyName) {
        var getter = [];
        if (ablType) {
            switch (ablType.toUpperCase()) {
                case "DATE":
                    getter.push(`           set => this["${propertyName}"] = value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);`);
                    break;
                case "DATETIME":
                    getter.push(`           set => this["${propertyName}"] = value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);`);
                    break;
                case "DATETIME-TZ":
                    getter.push(`           set => this["${propertyName}"] = value.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture);`);
                    break;
                case "DECIMAL":
                case "INT64":
                case "INTEGER":
                case "LOGICAL":
                default:
                    getter.push(`           set => this["${propertyName}"] = value;`);
            }
        } else getter.push(`           set => this["${propertyName}"] = value;`);
        return getter.join("\n");
    }

    function genDSFromSchema(dsName, dsSchema) {

        for (var pndx in dsSchema.properties) {
            genTableFromSchema(pndx, dsSchema.properties[pndx])
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
            `       protected override void ImportTables(JsonValue value)`,
            `       {`
        ];
        for (var pndx in dsSchema.properties) {
            content.push(`            if (value.Get("${pndx}") is IEnumerable<JsonValue> t${pndx})`);
            content.push(`                Join("${pndx}", new ${pndx}(t${pndx}.Cast<JsonObject>()));`);
        }
        content.push(`       }`);

        for (var pndx in dsSchema.properties) {
            content.push(`       public ${pndx} ${pndx}`);
            content.push(`       {`);
            content.push(`           get => this.Get("${pndx}") as ${pndx};`);
            content.push(`           set => this["${pndx}"] = value;`);
            content.push(`       }`);
        }


        content = content.concat([
            `   }`,
            `}`
        ]);

        console.log(`${clientPath}${sep}Models${sep}${dsName}.cs`);
        fs.writeFileSync(`${clientPath}${sep}Models${sep}${dsName}.cs`, content.join('\n'));
    }

    function genTableFromSchema(tableName, tableSchema) {

        genRecordFromSchema(tableName.replace(/^tt/, "tr"), tableSchema.items.properties, tableSchema.primaryKey);
        var content = [
            `using System.Collections.Generic;`,
            `using System.Json;`,
            `using NCDO.CDOMemory;`,
            `using ${clientName}.Models.Records;`,
            `namespace ${clientName}.Models.Tables`,
            `{`,
            `    public class ${tableName} : CDO_Table<${tableName.replace(/^tt/, "tr")}>`,
            `    {`,
            `       public ${tableName}(params ${tableName.replace(/^tt/, "tr")}[] items): base(items)`,
            `       {`,
            `       }`,
            `       public ${tableName}(IEnumerable<${tableName.replace(/^tt/, "tr")}> items): base(items)`,
            `       {`,
            `       }`,
            `       public ${tableName}(IEnumerable<JsonObject> items) : base(items)`,
            `       {`,
            `       }`,
            `   }`,
            `}`
        ];
        console.log(`${clientPath}${sep}Models${sep}Tables${sep}${tableName}.cs`);
        fs.writeFileSync(`${clientPath}${sep}Models${sep}Tables${sep}${tableName}.cs`, content.join('\n'));
    }

    function genRecordFromSchema(recordName, recordSchema, primaryKeys) {
        primaryKeys = primaryKeys || [];
        var content = [
            "using System;",
            "using System.ComponentModel;",
            "using System.ComponentModel.DataAnnotations;",
            "using System.Globalization;",
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
                    content.push(`       [DisplayName("${propObj.title}")]`);
                }
                if (primaryKeys.indexOf(rndx) !== -1) {
                    content.push(`       [Key]`);
                }
                var property = [
                    `       public ${convertABLType(propObj.ablType)} ${rndx}`,
                    "       {",
                    `${genABLTypeGetter(propObj.ablType, rndx)}`,
                    `${genABLTypeSetter(propObj.ablType, rndx)}`,
                    "       }"
                ]
                content.push(property.join("\n"));
            }
        }
        content.push(`   }`);
        content.push(`}`);

        console.log(`${clientPath}${sep}Models${sep}Records${sep}${recordName}.cs`);
        fs.writeFileSync(`${clientPath}${sep}Models${sep}Records${sep}${recordName}.cs`, content.join('\n'));
    }

    if (schema) {
        for (var pndx in schema.properties) {
            genDSFromSchema(pndx, schema.properties[pndx])
        }
    }
}