# NCDO_ClientGen
Copyright (c) 2017 - 2018 Robin Herbots Licensed under the MIT license (http://opensource.org/licenses/mit-license.php)

[![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=LXZNPVLB4P7GU)

Generate a .NET client from a CloudDataObject Catalog (see <a href="https://github.com/CloudDataObject/CDO">CDO specification</a>). 

The generated client makes use of <a href="https://github.com/RobinHerbots/NCDO">NCDO</a>.

## Prerequisites 
-  <a href="https://nodejs.org/en/download/">Node.js</a>.
-  <a href="https://www.microsoft.com/net/download/core">.NET Core 2.x SDK</a>.

## Install

    $ npm install ncdo_clientgen --save-dev

## Usage

ncdo_clientgen catalogurl [path]


Example:
```
ncdo_clientgen http://<hostname>/static/CDOService.json ./
```

