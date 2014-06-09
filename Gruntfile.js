/*
* grunt-asset-packager
* https://github.com/sillypog/grunt-asset-packager
*
* Copyright (c) 2013 Peter Hastie
* Licensed under the MIT license.
*/

'use strict';

var testFiles = [{ src: ['test/fixtures/asset_packages/**/*.pkg'], expand: true }],
    githubRegex = /:(.*)\.git/;

module.exports = function (grunt) {
	// load all npm grunt tasks
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		asset_packager: {
			options: {
				index: 'test/fixtures/index.html',
				asset_path_separator: ' ',
				output_prefix: {
					js: 'js',
					css: 'css'
				}
			},
			dev: {
				options: {
					dest: 'tmp/dev'
				},
				files: testFiles
			},
			prod: {
				options: {
					dest: 'tmp/prod'
				},
				files: testFiles
			}
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		},

		// Separate task to check for conflicts
		concat: {
			conflict: {
				src: ['test/fixtures/js/*.js'],
				dest: 'tmp/prod/js/concatenated.js'
			}
		},

		release: {
			options: {
				commitMessage: 'Version <%= version %>',
				github: {
					repo: '<%= pkg.repository.url.match(githubRegex)[1] %>',
					usernameVar: 'GITHUB_USERNAME', //ENVIRONMENT VARIABLE that contains Github username
					passwordVar: 'GITHUB_PASSWORD' //ENVIRONMENT VARIABLE that contains Github password
				}
			}
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// Allow setting the global config that is read by asset_packager
	grunt.registerTask('set_config', 'Set a config property.', function(name, val){
		grunt.config.set(name, val);
	});

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('dev', ['set_config:mode:DEVELOPMENT', 'asset_packager:dev']);
	grunt.registerTask('prod', ['set_config:mode:PRODUCTION', 'asset_packager:prod', 'concat']);	// By running concat here it should undo the uglifying unless cleanup worked
	grunt.registerTask('test', ['clean', 'dev', 'prod', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
