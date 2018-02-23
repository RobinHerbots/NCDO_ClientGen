var fs = require("fs"),
    sep = require('path').sep;

module.exports = function (service, clientName, clientPath, catalogUrl) {
    if (service) {
        var content = [
            `using System;`,
            `using NCDO;`,
            `namespace ${clientName}`,
            `{`,
            `   public class ${clientName}Options : CDOSessionOptions`,
            `   {`,
            `       public ${clientName}Options()`,
            `       {`,
            `          ServiceUri = new Uri("${catalogUrl.href.replace(`/static/${service.name}.json`, "")}");`,
            `       }`,
            `   }`,
            `}`
        ];

        console.log(`${clientPath}${sep}${clientName}Options.cs`);
        fs.writeFileSync(`${clientPath}${sep}${clientName}Options.cs`, content.join('\n'));
    }
}