var fs = require("fs"),
    sep = require('path').sep;


var _clientName, _clientPath, DDS = {DS: [], TT: []};

function normalizePropertyName(propertyName) {
    return propertyName.replace("-", "_");
}

function convertABLType(propObj, nullable, ignoreType) {
    var ablType = propObj.ablType, typeStr = "string";
    if (nullable === undefined || propObj.type === "array") nullable = "";
    if (ablType) {
        switch (ablType.toUpperCase()) {
            case "DATE":
            case "DATETIME":
            case "DATETIME-TZ":
                typeStr = `DateTime${nullable}`;
                break;
            case "DECIMAL":
                typeStr = `decimal${nullable}`;
                break;
            case "INT64":
                typeStr = `Int64${nullable}`;
                break;
            case "INTEGER":
                typeStr = `int${nullable}`;
                break;
            case "LOGICAL":
                typeStr = `bool${nullable}`;
                break;
            default:
                typeStr = "string";
                break;
        }
    }

    if (ignoreType !== true && propObj.type === "array") {
        typeStr += `[]`;
    }

    return typeStr;
}

function genABLTypeGetter(propObj, propertyName, backingField) {
    var getter = [], ablType = propObj.ablType;
    // getter.push("           get");
    // getter.push("           {");
    if (ablType) {
        switch (ablType.toUpperCase()) {
            case "DATE":
                if (propObj.type === "array")
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = this["${propertyName}"].ToArray().Select(d => (DateTime.TryParseExact(d, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue)));`);
                else
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = (DateTime.TryParseExact(this.Get("${propertyName}"), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue))).Value;`);
                break;
            case "DATETIME":
                if (propObj.type === "array")
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = this["${propertyName}"].ToArray().Select(d => (DateTime.TryParseExact(d, "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue)));`);
                else
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = (DateTime.TryParseExact(this.Get("${propertyName}"), "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue))).Value;`);
                break;
            case "DATETIME-TZ":
                if (propObj.type === "array")
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = this["${propertyName}"].ToArray().Select(d => (DateTime.TryParseExact(d, "yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue)));`);
                else
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = (DateTime.TryParseExact(this.Get("${propertyName}"), "yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result) ? result : DateTime.MinValue))).Value;`);
                break;
            case "DECIMAL":
            case "INT64":
            case "INTEGER":
            case "LOGICAL":
                if (propObj.type === "array")
                    getter.push(`           get => _${propertyName} ?? (_${propertyName} = this["${propertyName}"].ToArray<${convertABLType(propObj, undefined, true)}>());`);
                else
                    getter.push(`           get => (_${propertyName} ?? (_${propertyName} = this["${propertyName}"])).Value;`);
                break;
            default:
                if (propObj.type === "array")
                    getter.push(`           get => _${propertyName} ?? (_${propertyName} = this["${propertyName}"].ToArray());`);
                else
                    getter.push(`           get => _${propertyName} ?? (_${propertyName} = this["${propertyName}"]);`);
        }
    } else {
        if (propObj.type === "array")
            getter.push(`           get => _${propertyName} ?? (_${propertyName} = this["${propertyName}"].ToArray());`);
        else
            getter.push(`           get => _${propertyName} ?? (_${propertyName} = this["${propertyName}"]);`);
    }
    // getter.push("           }");
    return getter.join("\n");
}

function genABLTypeSetter(propObj, propertyName) {
    var getter = [], ablType = propObj.ablType;
    if (ablType) {
        switch (ablType.toUpperCase()) {
            case "DATE":
                if (propObj.type === "array")
                    getter.push(`           set => this["${propertyName}"] = (_${propertyName} = value).Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);`);
                else
                    getter.push(`           set => this["${propertyName}"] = (_${propertyName} = value).Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);`);
                break;
            case "DATETIME":
                if (propObj.type === "array")
                    getter.push(`           set => this["${propertyName}"].AddRange((_${propertyName} = value).Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture));`);
                else
                    getter.push(`           set => this["${propertyName}"] = (_${propertyName} = value).Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);`);
                break;
            case "DATETIME-TZ":
                if (propObj.type === "array")
                    getter.push(`           set => this["${propertyName}"].AddRange((_${propertyName} = value).Value.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture));`);
                else
                    getter.push(`           set => this["${propertyName}"] = (_${propertyName} = value).Value.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture);`);
                break;
            case "DECIMAL":
            case "INT64":
            case "INTEGER":
            case "LOGICAL":
            default:
                if (propObj.type === "array")
                    getter.push(`           set => this["${propertyName}"].AddRange(_${propertyName} = value);`);
                else
                    getter.push(`           set => this["${propertyName}"] = _${propertyName} = value;`);
        }
    } else {
        if (propObj.type === "array")
            getter.push(`           set => this["${propertyName}"].AddRange(_${propertyName} = value);`);
        else
            getter.push(`           set => this["${propertyName}"] = _${propertyName} = value;`);
    }
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

    if (tableSchema.type === "array" && DDS.TT.indexOf(tableName) === -1) {
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
    ], primaryKeyContent=[];

    for (var rndx in recordSchema) {
        var propObj = recordSchema[rndx],
            propName = normalizePropertyName(rndx);
        if (propObj.semanticType !== "Internal") {
            //set backend field
            content.push(`       private ${convertABLType(propObj, "?")} _${propName};`);
            if (propObj.title !== "") {
                content.push(`       [DisplayName("${propObj.title}")]`);
            }
            if (propObj.default !== undefined) {
                if ((propObj.type === "string" || (propObj.type === "array" && propObj.items && propObj.items.type === "string")) && propObj.default !== null)
                    content.push(`       [DefaultValue("${propObj.default}")]`);
                else content.push(`       [DefaultValue(${propObj.default})]`);
            }

            if (primaryKeys.indexOf(propName) !== -1) {
                content.push(`       [Key]`);
                if(primaryKeyContent.length == 0) {
                    primaryKeyContent.push(`        #region Overrides of CDO_Record<${recordName}>`);
                    primaryKeyContent.push(`        /// <inheritdoc />`);
                    primaryKeyContent.push(`        public override string GetId() => _${propName}.ToString();`);
                    primaryKeyContent.push(`        /// <inheritdoc />`);
                    primaryKeyContent.push(`        public override void SetId(string value)`);
                    primaryKeyContent.push(`        {`);
                    primaryKeyContent.push(`            if (${convertABLType(propObj)}.TryParse(value, out ${convertABLType(propObj)} __ID)) ${propName} = __ID;`);
                    primaryKeyContent.push(`        }`);
                    primaryKeyContent.push(`        #endregion`);
                }
            }
            var property = [
                `       public ${convertABLType(propObj)} ${propName}`,
                "       {",
                `${genABLTypeGetter(propObj, propName)}`,
                `${genABLTypeSetter(propObj, propName)}`,
                "       }"
            ]
            content.push(property.join("\n"));
        }
    }
    //insert primerykey overrides
    if(primaryKeyContent.length == 0) {
        primaryKeyContent.push(`        #region Overrides of CDO_Record<${recordName}>`);
        primaryKeyContent.push(`        private string _id = Guid.NewGuid().ToString();`);
        primaryKeyContent.push(`        /// <inheritdoc />`);
        primaryKeyContent.push(`        public override string GetId() => _id;`);
        primaryKeyContent.push(`        /// <inheritdoc />`);
        primaryKeyContent.push(`        public override void SetId(string value)`);
        primaryKeyContent.push(`        {`);
        primaryKeyContent.push(`            _id = value;`);
        primaryKeyContent.push(`        }`);
        primaryKeyContent.push(`        #endregion`);
    }
    content.push(primaryKeyContent.join("\n"));

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