# grunt-ncdo-clientgen

> ncdo_clientgen task

## Getting Started
This plugin requires Grunt

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-ncdo-clientgen --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-ncdo-clientgen');
```

## The "ncdo_clientgen" task

### Overview
In your project's Gruntfile, add a section named `ncdo_clientgen` to the data object passed into `grunt.initConfig()`.

```js
  ncdo_clientgen: {
            default: {
                options: {
                    catalogUrl: "http://<hostname>/static/CDOService.json",
                    outputpath: "../.."
                }
            }
        }
```

### Options

#### options.catalogUrl

Uri or file of the catalog.json

#### options.outputpath

outputpath for the client

#### options.noclean

do not clear the current generated project

#### options.framework

specify target framework (ex. netstandard20, net472, net461

#### options.bearerToken

bearer : token to pass in the Authorization header to access the catalog (if secured)
