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

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	function processLine(packages, match, lineOpen, lineClose, env){
		var packageName = match[3];
		if (packages[packageName]){
			if (env == 'DEVELOPMENT'){
				// Replace the package line in the array with a line built from the package
				return packages[packageName].map(function(packagedFile){
					return expandLine(match[1], lineOpen, packagedFile.filename, lineClose);
				}).join(grunt.util.linefeed);
			} else if (env == 'PRODUCTION'){
				return expandLine(match[1], lineOpen, packageName, lineClose);
			}
		} else {
			grunt.fail.warn('Reference to nonexistant package '+packageName);
		}
	}

	function expandLine(whitespace, lineOpen, fileName, lineClose){
		return whitespace + lineOpen + fileName + lineClose;
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

	grunt.registerMultiTask('asset_packager', 'Packages javascript and stylesheets similarly to the smart_asset gem.', function() {

		var options = this.options() || {},
		    mode = grunt.config.get('mode'),
		    packages = {},
		    externalConfigs = {};

		this.files.forEach(function(file){
			grunt.log.writeln('\nProcessing asset file: '+file.src);
			var content = grunt.file.read(file.src),
			    packageName = path.basename(file.src, path.extname(file.src));
			packages[packageName] = buildPackageContents(content, options.asset_path_separator);
		}, this);

		if (mode == 'DEVELOPMENT'){
			// For all of the packages, copy all of their contents
			createExternalConfig(this.name, externalConfigs, 'copy', null, []);

			_.forEach(packages, function(packageContent){
				var mappedContent = packageContent.map(function(packagedFile){
					return {
						src: packagedFile.src_prefix + packagedFile.filename,
						dest: options.dest + path.sep + packagedFile.filename
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
				var destination = options.dest + path.sep + packageName,
				    mappedContent = packageContent.map(function(packagedFile){
				    	return packagedFile.src_prefix + packagedFile.filename;
				    });
				if (/js$/.test(destination)){
					externalConfigs.concat[this.name].files[destination] = mappedContent;
					externalConfigs.uglify[this.name].files[destination] = destination;
				} else if (/css$/.test(destination)){
					externalConfigs.cssmin[this.name].files[destination] = mappedContent;
				}
			}, this);

			runTasks(this.name, externalConfigs, ['concat', 'uglify', 'cssmin']);
		}

		// Get the file defined for index
		// Read through it and when reaching a marker
		// Replace the marker with the contents of the appropriate package from package object
		var indexContent = grunt.file.read(options.index),
		    indexLines = indexContent.split(grunt.util.linefeed),
		    // Regex use backreferencing (eg \1) to identify the type of quote used and select everything between that set.
		    // This still probably won't work with escaped quotes within a string
		    partialRegEx = /(\s*)<script-partial src=(["|'])([^\2]+?)\2/,
		    processRegEx = /process=(["|'])true\1/,
		    scriptRegEx = /(\s*)<script-package src=(["|'])([^\2]+?)\2/,
		    styleRegEx = /(\s*)<style-package src=(["|'])([^\2]+?)\2/;  // Storing the whitespace so we can preserve it

		indexLines.forEach(function(line, i, lines){
			var match;
			if (match = line.match(scriptRegEx)){
				lines[i] = processLine(packages, match, '<script src="', '"></script>', mode);
			} else if (match = line.match(styleRegEx)){
				lines[i] = processLine(packages, match, '<link rel="stylesheet" href="', '">', mode);
			} else if (match = line.match(partialRegEx)){
				lines[i] = writePartial(match, processRegEx.test(line), options);
			}
		}, this);

		var indexOutput = indexLines.join(grunt.util.linefeed);

		grunt.file.write(options.dest + path.sep + 'index.html', indexOutput);
	});
};
