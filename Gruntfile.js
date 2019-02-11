var sep = require('path').sep,
    child_process = require('child_process');

module.exports = function (grunt) {
    grunt.initConfig({
        release: {
            options: {
                additionalFiles: ['grunt-ncdo-clientgen/package.json']
            }
        },
        availabletasks: {
            tasks: {
                options: {
                    filter: 'exclude',
                    tasks: ['availabletasks', 'default']
                }
            }
        }
    });

// Load the plugin that provides the tasks.
    require('load-grunt-tasks')(grunt);
    grunt.registerTask('default', ["availabletasks"]);
    grunt.registerTask("release_grunt", "Release grunt plugin for ncdo_clientgen", function () {
        var done = this.async(), pkg = grunt.file.readJSON("grunt-ncdo-clientgen/package.json");
        pkg.dependencies.ncdo_clientgen = pkg.version;
        grunt.file.write("grunt-ncdo-clientgen/package.json", JSON.stringify(pkg));

        child_process.execSync(`npm publish grunt-ncdo-clientgen`, function (error, stdout, stderr) {
                if (error) {
                    console.error("exec error: " + error);
                    return;
                }

                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                done();
            }
        );
    });
    grunt.registerTask('publish', ["release", "release_grunt"]);
};