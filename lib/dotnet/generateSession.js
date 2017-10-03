var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (service, clientName, clientPath, catalogUrl) {
    var content = [
        `using System;`,
        `using NCDO;`,
        `using ${clientName}.CDO;`,
        `namespace ${clientName}`,
        `{`,
        `   public class ${clientName} : CDOSession`,
        `   {`,
        `       public ${clientName}() : this(new Uri("${catalogUrl.href.replace(`/static/${service.name}.json`, "")}"))`,
        `       {`,
        `       }`,
        `       public ${clientName}(Uri serviceUri) : base(serviceUri)`,
        `       {`,
        `           AddCatalog(new Uri($"{serviceUri.AbsoluteUri}/static/${service.name}.json", UriKind.Absolute)).Wait();`,
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