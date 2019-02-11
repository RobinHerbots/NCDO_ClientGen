/*
 * grunt-ncdo-clientgen
 * https://github.com/RobinHerbots/NCDO_ClientGen
 *
 * Copyright (c) 2019 Robin Herbots
 * Licensed under the MIT license.
 */

'use strict';

var cg = require("ncdo_clientgen"),
    path = require('path');

module.exports = function (grunt) {
    grunt.registerMultiTask('ncdo_clientgen', 'ncdo_clientgen task', function () {
        var opts = this.options({}), done = this.async();
        opts.catalogUrl = grunt.option('catalogUrl') || opts.catalogUrl || undefined;
        opts.outputpath = grunt.option('outputpath') || opts.outputpath || process.cwd()
        opts.noclean = grunt.option('noclean') || opts.noclean || false;
        opts.framework = grunt.option('framework') || opts.framework || undefined;
        opts.bearer = grunt.option('bearer') || opts.bearer || undefined;

        opts.outputpath = path.relative(process.cwd(), opts.outputpath);

        //check options
        if (opts.catalogUrl === undefined) {
            grunt.log.writeln("required catalogUrl option");
            grunt.log.writeln("optional:");
            grunt.log.writeln("       outputpath : outputpath for the client");
            grunt.log.writeln("       noclean : do not clear the current generated project");
            grunt.log.writeln("       framework : specify target framework (ex. netstandard20, net472, net461)");
            grunt.log.writeln("       bearer : token to pass in the Authorization header to access the catalog (if secured)");
            done();
        } else {
            grunt.log.writeln("Generating client for " + opts.catalogUrl);
            grunt.log.writeln(JSON.stringify(opts));
            cg(opts.catalogUrl, opts.outputpath, opts.noclean, opts.framework, opts.bearer).then(function (data) {
                grunt.log.writeln(data);
                done();
            }).error(function (data) {
                grunt.log.writeln(data);
                done();
            });
        }
    });

};
