var sep = require('path').sep;

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        availabletasks: {
            tasks: {
                options: {
                    filter: 'exclude',
                    tasks: ['availabletasks', 'default'],
                    showTasks: ['user']
                }
            }
        }
    });

// Load the plugin that provides the tasks.
    require('load-grunt-tasks')(grunt);
    grunt.registerTask('release', ["release"]);
    grunt.registerTask('default', ["availabletasks"]);
};