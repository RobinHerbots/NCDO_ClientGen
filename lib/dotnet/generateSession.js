var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (service, clientName, clientPath, catalogUrl) {
    if (service) {
        var content = [
            `using System;`,
            `using NCDO;`,
            `using ${clientName}.CDO;`,
            `using NCDO.Definitions;`,
            `namespace ${clientName}`,
            `{`,
            `   public partial class ${clientName} : CDOSession`,
            `   {`,
            `       public ${clientName}(AuthenticationModel authenticationModel = AuthenticationModel.Anonymous, string userName = null, string password = null) : this(new Uri("${catalogUrl.href.replace(`/static/${service.name}.json`, "")}"), authenticationModel, userName, password)`,
            `       {`,
            `       }`,
            `       public ${clientName}(Uri serviceUri, AuthenticationModel authenticationModel = AuthenticationModel.Anonymous, string userName = null, string password = null) : base(serviceUri, authenticationModel)`,
            `       {`,
            `           AddCatalog(new Uri($"{serviceUri.AbsoluteUri}/static/${service.name}.json", UriKind.Absolute), userName, password).Wait();`,
            `           Login(userName, password).Wait();`
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