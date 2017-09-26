var fs = require("fs"),
    sep = require('path').sep;

module.exports =     function (schema, clientName, clientPath) {
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