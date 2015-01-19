/*
* grunt-asset-packager
* https://github.com/sillypog/grunt-asset-packager
*
*
* Copyright (c) 2013 Peter Hastie
* Licensed under the MIT license.
*/

// Go to the directory defined for assets
// For each file in there
// Create a property on the packages object named after the package
// If development:
//  Read line by line and get file specified on each line
//  Write the file to the package object
//  Copy that file to build folder
// If production:
//  Concatenate and uglify the files to build
//  Write the package name to the package object

'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    _ = require('lodash'),
    chomp = require('chomp');

module.exports = function (grunt) {
	// Regex use backreferencing (eg \1) to identify the type of quote used and select everything between that set.
	// This still probably won't work with escaped quotes within a string
	var regex = {
		js: /js$/,
		css: /css$/,
		partial: /(\s*)<script-partial src=(["|'])([^\2]+?)\2/,
		process: /process=(["|'])true\1/,
		script: /(\s*)<script-package src=(["|'])([^\2]+?)\2/,
		style: /(\s*)<style-package src=(["|'])([^\2]+?)\2/  // Storing the whitespace so we can preserve it
	};

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	function writeIncludes(options, mode, packages){
		// Want to write an include file for each package
		// The content will be determined by the mode
		// - dev: a script tag for each file in the package
		// - prod: a single script tag with the name of the package
		// Include file extension should be .html, not .js

		_.each(packages, function(value, key){
			var includeName = key.replace(/\..*/, '.html'),
			    fileContent;
			if (mode == 'DEVELOPMENT'){
				fileContent = value.map(function(packagedFile){
					return '<script src="' + options.output_prefix.js + path.sep + packagedFile.filename + '"></script>';
				}).join(grunt.util.linefeed);
			} else if (mode == 'PRODUCTION'){
				fileContent = '<script src="' + options.output_prefix.js + path.sep + key + '"></script>';
			}
			grunt.file.write(options.js.includes + path.sep + includeName, fileContent);
		});
	}

	function writeIndexFile(options, mode, packages){
		// Get the file defined for index
		// Read through it and when reaching a marker
		// Replace the marker with the contents of the appropriate package from package object
		var indexContent = grunt.file.read(options.index),
		    indexLines = indexContent.split(grunt.util.linefeed);

		indexLines.forEach(function(line, i, lines){
			var match;
			if (match = line.match(regex.script)){
				lines[i] = processLine(packages, match, '<script src="', '"></script>', mode, outputPrefix(options.output_prefix, 'js'));
			} else if (match = line.match(regex.style)){
				lines[i] = processLine(packages, match, '<link rel="stylesheet" href="', '">', mode, outputPrefix(options.output_prefix, 'css'));
			} else if (match = line.match(regex.partial)){
				lines[i] = writePartial(match, regex.process.test(line), options);
			}
		}, this);

		var indexOutput = indexLines.join(grunt.util.linefeed);

		grunt.file.write(options.dest + path.sep + 'index.html', indexOutput);
	}

	function processLine(packages, match, lineOpen, lineClose, env, outputPrefix){
		var packageName = match[3];
		if (packages[packageName]){
			if (env == 'DEVELOPMENT'){
				// Replace the package line in the array with a line built from the package
				return packages[packageName].map(function(packagedFile){
					return expandLine(match[1], lineOpen, outputPrefix, packagedFile.filename, lineClose);
				}).join(grunt.util.linefeed);
			} else if (env == 'PRODUCTION'){
				return expandLine(match[1], lineOpen, outputPrefix, packageName, lineClose);
			}
		} else {
			grunt.fail.warn('Reference to nonexistant package '+packageName);
		}
	}

	function expandLine(whitespace, lineOpen, outputPrefix, fileName, lineClose){
		return whitespace + lineOpen + outputPrefix + fileName + lineClose;
	}

	function writePartial(match, process, options){
		var path = match[3],
			text = '';
		if (grunt.file.exists(path) && grunt.file.isFile(path)){
			text = grunt.file.read(path);// content of file
			if (process){
				text = grunt.template.process(text, options.process);
			}
		} else {
			grunt.warn('No partial: '+path);
		}
		return text;
	}

	function createExternalConfig(name, configs, task, options, files){
		configs[task] = grunt.config(task) || {};
		configs[task][name] = { files: files || {} };
		if (options){
			configs[task][name].options = options;
		}
	}

	function runTasks(name, configs, tasks){
		tasks.forEach(function(task){
			grunt.config(task, configs[task]);
			grunt.task.run(task+':'+name);
		});
		grunt.task.run('asset_packager_cleanup');
	}

	function buildPackageContents(content, separator){
		var files = content.chomp().split(grunt.util.linefeed);

		return files.map(function(file){
			var parts = file.split(separator);
			return {
				src_prefix: parts[0],
				filename: parts[1]
			};
		});
	}

	function outputPrefix(prefices, packageName){
		var type;
		if (regex.js.test(packageName)){
			type = 'js';
		} else if (regex.css.test(packageName)){
			type = 'css';
		}
		return prefices ? prefices[type] + path.sep : '';
	}

	function checkConfiguration(options, mode){
		if (options.index){
			if (options.js) {
				grunt.fail.warn('index and js options are both set', 3);
			}
			if (!options.dest){
				grunt.fail.warn('no dest specified for output', 3);
			}
		} else {
			if (options.js){
				if (!options.js.includes){
					grunt.fail.warn('no js includes output directory specified', 3);
				}
				if (!options.js.source){
					grunt.fail.warn('no js source output directory specified', 3);
				}
			} else {
				grunt.fail.warn('neither index nor js option is set', 3);
			}
		}

		if (!_.contains(['DEVELOPMENT','PRODUCTION'],mode)){
			grunt.fail.warn('mode must be set to DEVELOPMENT or PRODUCTION', 3);
		}
	}

	grunt.registerMultiTask('asset_packager', 'Packages javascript and stylesheets similarly to the smart_asset gem.', function() {

		var options = this.options({
		    	asset_path_separator: ' ',
		    	output_prefix: {
		    		js: 'js',
		    		css: 'css'
		    	}
		    }),
		    mode = grunt.config.get('mode'),
		    packages = {},
		    externalConfigs = {};

		options.sourceDest = options.dest || options.js.source;

		checkConfiguration(options, mode);

		this.files.forEach(function(file){
			grunt.log.writeln('\nProcessing asset file: '+file.src);
			var content = grunt.file.read(file.src),
			    packageName = path.basename(file.src, path.extname(file.src));
			packages[packageName] = buildPackageContents(content, options.asset_path_separator);
		}, this);

		if (mode == 'DEVELOPMENT'){
			// For all of the packages, copy all of their contents
			createExternalConfig(this.name, externalConfigs, 'copy', null, []);

			_.forEach(packages, function(packageContent, packageName){
				var mappedContent = packageContent.map(function(packagedFile){
					return {
						src: packagedFile.src_prefix + packagedFile.filename,
						dest: options.sourceDest + path.sep + outputPrefix(options.output_prefix, packageName) + packagedFile.filename
					};
				});
				externalConfigs.copy[this.name].files = externalConfigs.copy[this.name].files.concat(mappedContent);
			}, this);

			runTasks(this.name, externalConfigs, ['copy']);

		} else if (mode == 'PRODUCTION'){

			//  Concatenate and uglify the files to build
			var bannerString = 'Generated by grunt-asset-packager at <%= grunt.template.today("dd-mm-yyyy h:MM:ss TT") %>';
			createExternalConfig(this.name, externalConfigs, 'concat', { separator: ';\n\n' });
			createExternalConfig(this.name, externalConfigs, 'uglify', { banner: '//'+bannerString+'\n' });
			createExternalConfig(this.name, externalConfigs, 'cssmin', { banner: '/*'+bannerString+'*/' });

			// Loop over the packages and populate the files object
			_.forEach(packages, function(packageContent, packageName){
				var destination = options.sourceDest + path.sep + outputPrefix(options.output_prefix, packageName) + packageName,
				    mappedContent = packageContent.map(function(packagedFile){
				    	return packagedFile.src_prefix + packagedFile.filename;
				    });
				if (regex.js.test(destination)){
					externalConfigs.concat[this.name].files[destination] = mappedContent;
					externalConfigs.uglify[this.name].files[destination] = destination;
				} else if (regex.css.test(destination)){
					externalConfigs.cssmin[this.name].files[destination] = mappedContent;
				}
			}, this);

			runTasks(this.name, externalConfigs, ['concat', 'uglify', 'cssmin']);
		}

		if (options.index) {
			writeIndexFile(options, mode, packages);
		} else if (options.js.includes) {
			writeIncludes(options, mode, packages);
		}
	});
};
