/*
* grunt-asset-packager
* https://github.com/sillypog/grunt-asset-packager
*
*
* Copyright (c) 2013 Peter Hastie
* Licensed under the MIT license.
*/

'use strict';

var util = require('util'),
	_ = require('lodash');

module.exports = function (grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerTask('asset_packager_cleanup', 'Prevents conflicts when using asset_packager', function() {
		var parentTask = 'asset_packager',
			dirtyTasks = ['copy', 'concat', 'uglify', 'cssmin'];

		_.forEach(dirtyTasks, function(dirtyTask){
			var dirtyConfig = grunt.config(dirtyTask);

			if (dirtyConfig && dirtyConfig[parentTask]){
				delete dirtyConfig[parentTask];
				grunt.config.set(dirtyTask, dirtyConfig);	// Not actually a dirtyConfig anymore
			}
		});
	});
};
