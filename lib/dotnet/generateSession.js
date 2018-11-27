var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (service, clientName, clientPath, catalogResource) {
    if (service) {
        var content = [
            `using System;`,
            `using System.Reflection;`,
            `using NCDO;`,
            `using ${clientName}.CDO;`,
            `namespace ${clientName}`,
            `{`,
            `   public partial class ${clientName} : CDOSession`,
            `   {`,
            `       public ${clientName}(${clientName}Options options) : base(options)`,
            `       {`,
            `           LoadEmbeddedCatalog(Assembly.GetAssembly(GetType()),"${catalogResource}");`,
            `           Login().Wait();`
        ];

        for (var rndx in service.resources) {
            content.push(`           ${service.resources[rndx].name} = new ${service.resources[rndx].name}(this);`);
        }
        content.push(`       }`);
        for (var rndx in service.resources) {
            content.push(`      public ${service.resources[rndx].name} ${service.resources[rndx].name} { get; }`);
        }


        content = content.concat([
            `   }`,
            `}`
        ]);

        console.log(`${clientPath}${sep}${clientName}.cs`);
        fs.writeFileSync(`${clientPath}${sep}${clientName}.cs`, content.join('\n'));
    }
}