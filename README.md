# NCDO_ClientGen
Copyright (c) 2017 - 2018 Robin Herbots Licensed under the MIT license (http://opensource.org/licenses/mit-license.php)

[![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=LXZNPVLB4P7GU)

Generate a .NET client from a CloudDataObject Catalog (see <a href="https://github.com/CloudDataObject/CDO">CDO specification</a>). 

The generated client makes use of <a href="https://github.com/RobinHerbots/NCDO">NCDO</a>.

## Prerequisites 
-  <a href="https://nodejs.org/en/download/">Node.js</a>.
-  <a href="https://www.microsoft.com/net/download/core">.NET Core 2.x SDK</a>.

## Install

    $ npm install ncdo_clientgen -g

or

    $ npm install ncdo_clientgen --save-dev
    and in package.json
       ...
       "scripts": {
        "genclient": "ncdo_clientgen http://<hostname>/static/CDOService.json --output ./"
        ...
        
    $ npm run genclient

## Usage

```
ncdo_clientgen <catalogUrl> [options]
options:
       --output : outputpath for the client
       --noclean : do not clear the current generated project
       --framework : specify target framework (ex. netstandard20, net472, net461)
       --bearer : token to pass in the Authorization header to access the catalog (if secured)

```

Example:
```
ncdo_clientgen http://<hostname>/static/CDOService.json --output ./
```

