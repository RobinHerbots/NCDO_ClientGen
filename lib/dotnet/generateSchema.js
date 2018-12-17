var fs = require("fs"),
    sep = require('path').sep;


var _clientName, _clientPath, DDS = {DS: [], TT: []};

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

function genDSFromSchema(dsName, dsSchema, primary = false) {

    if (dsSchema.type === "object" && DDS.DS.indexOf(dsName) === -1) {
        DDS.DS.push(dsName);
    }

    for (var pndx in dsSchema.properties) {
        genTableFromSchema(pndx, dsSchema.properties[pndx]);
        if (primary) break;
    }

    var content = [
        `using System.Collections.Generic;`,
        `using System.Json;`,
        `using System.Linq;`,
        `using NCDO.CDOMemory;`,
        `using NCDO.Extensions;`,
        `using ${_clientName}.Models.Tables;`,

        `namespace ${_clientName}.Models`,
        `{`,
        `   public partial class ${dsName} : CDO_Dataset`,
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
        content.push(`            if (value?.Get("${pndx}") is IEnumerable<JsonValue> t${pndx})`);
        content.push(`                Add("${pndx}", new ${pndx}(t${pndx}.Cast<JsonObject>()));`);
        content.push(`            else Add("${pndx}", new ${pndx}());`);
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

    console.log(`${_clientPath}${sep}Models${sep}${dsName}.cs`);
    fs.writeFileSync(`${_clientPath}${sep}Models${sep}${dsName}.cs`, content.join('\n'));
}

function genTableFromSchema(tableName, tableSchema) {
    let fileName = `${_clientPath}${sep}Models${sep}Tables${sep}${tableName}.cs`;
    if (fs.existsSync(fileName)) {
        var recordName = `tr${tableName.replace(/^tt/, "")}`;
        genRecordFromSchema(recordName, tableSchema.items.properties, tableSchema.primaryKey);
        return;
    }

    if (tableSchema.type === "array") {
        DDS.TT.push(tableName);
    }

    var recordName = `tr${tableName.replace(/^tt/, "")}`;
    genRecordFromSchema(recordName, tableSchema.items.properties, tableSchema.primaryKey);
    var content = [
        `using System.Collections.Generic;`,
        `using System.Json;`,
        `using NCDO.CDOMemory;`,
        `using ${_clientName}.Models.Records;`,
        `namespace ${_clientName}.Models.Tables`,
        `{`,
        `    public partial class ${tableName} : CDO_Table<${recordName}>`,
        `    {`,
        `       public ${tableName}(params ${recordName}[] items): base(items)`,
        `       {`,
        `       }`,
        `       public ${tableName}(IEnumerable<${recordName}> items): base(items)`,
        `       {`,
        `       }`,
        `       public ${tableName}(IEnumerable<JsonObject> items) : base(items)`,
        `       {`,
        `       }`,
        `   }`,
        `}`
    ];
    console.log(fileName);
    fs.writeFileSync(fileName, content.join('\n'));
}

function genRecordFromSchema(recordName, recordSchema, primaryKeys) {
    const fileName = `${_clientPath}${sep}Models${sep}Records${sep}${recordName}.cs`;
    if (fs.existsSync(fileName) && !primaryKeys)
        return;
    primaryKeys = primaryKeys || [];
    var content = [
        "using System;",
        "using System.ComponentModel;",
        "using System.ComponentModel.DataAnnotations;",
        "using System.Globalization;",
        `using NCDO.CDOMemory;`,
        `using NCDO.Extensions;`,
        `using JsonPair = System.Collections.Generic.KeyValuePair<string, System.Json.JsonValue>;`,
        `using JsonPairEnumerable = System.Collections.Generic.IEnumerable<System.Collections.Generic.KeyValuePair<string, System.Json.JsonValue>>;`,
        `namespace ${_clientName}.Models.Records`,
        `{`,
        `   public partial class ${recordName} : CDO_Record<${recordName}>`,
        `   {`,
        `       #region Constructor`,
        `       public ${recordName}(params JsonPair[] items) : base(items)`,
        `       {`,
        `       }`,

        `       public ${recordName}(JsonPairEnumerable items) : base(items)`,
        `       {`,
        `       }`,

        `       public ${recordName}()`,
        `       {`,
        `       }`,
        `       #endregion`,
    ];
    for (var rndx in recordSchema) {
        var propObj = recordSchema[rndx];
        if (propObj.semanticType !== "Internal") {
            if (propObj.title !== "") {
                content.push(`       [DisplayName("${propObj.title}")]`);
            }
            if (propObj.default !== undefined) {
                if (propObj.type === "string" && propObj.default !== null)
                    content.push(`       [DefaultValue("${propObj.default}")]`);
                else content.push(`       [DefaultValue(${propObj.default})]`);
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

    console.log(fileName);
    fs.writeFileSync(fileName, content.join('\n'));
}

module.exports = {
    generateSchema: function (schema, clientName, clientPath) {
        _clientName = clientName;
        _clientPath = clientPath;
        if (schema) {
            for (var pndx in schema.properties) {
                genDSFromSchema(pndx, schema.properties[pndx])
            }
        }
    },
    generatePrimarySchema: function (schema, clientName, clientPath) {
        _clientName = clientName;
        _clientPath = clientPath;
        if (schema) {
            for (var pndx in schema.properties) {
                genDSFromSchema(pndx, schema.properties[pndx], true)
            }
        }
    },
    generateDD: function (dataDefinition, clientName, clientPath) {
        _clientName = clientName;
        _clientPath = clientPath;
        if (dataDefinition) {
            for (var dfndx in dataDefinition) {
                for (var pndx in dataDefinition[dfndx].properties) {
                    genDSFromSchema(pndx, dataDefinition[dfndx].properties[pndx])
                }
            }
        }
    },
    DDS: DDS
}