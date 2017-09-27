# NCDO_ClientGen
Generate a .NET client from a CloudDataObject Catalog (see <a href="https://github.com/CloudDataObject/CDO">CDO specification</a>). 

The generated client makes use of <a href="https://github.com/RobinHerbots/NCDO">NCDO</a>.


## Install

    $ npm install ncdo_clientgen --save-dev

## Usage

ncdo_clientgen catalogurl [path]


Example:
```
ncdo_clientgen http://<hostname>/static/CDOService.json ./
```

