# grunt-asset-packager [![Build Status](https://travis-ci.org/sillypog/grunt-asset-packager.png?branch=master)](https://travis-ci.org/sillypog/grunt-asset-packager) [![Dependency Status](https://david-dm.org/sillypog/grunt-asset-packager.png)](https://david-dm.org/sillypog/grunt-asset-packager) [![devDependency Status](https://david-dm.org/sillypog/grunt-asset-packager/dev-status.png)](https://david-dm.org/sillypog/grunt-asset-packager#info=devDependencies)

> Packages javascript and stylesheets similarly to the smart_asset gem.

## Why use asset-packager?
This task makes it easy to compile local and production versions of a static site. Rather than putting stylesheet and javascript includes directly in the html file they are put into package files; it is the package files that are referenced from the html file.

For example, a package file named `common.js` might contain the following lines:
```
src/js/file1.js
src/js/file2/js
```

`index.html` would then have this tag referencing that package:
```html
<script-package src="common.js" />
```

When the task is run with NODE_ENV set to 'DEVELOPMENT' [(see grunt-env)](https://npmjs.org/package/grunt-env), the javascript files will be copied to the build directory and the `<script-package>` tag replaced by `<script>` tags including each file.

When the task is run with NODE_ENV set to 'PRODUCTION', the javascript files will be concatenated and uglified into a single file named `common.js` and the `<script-package>` tag replaced by a single `<script>` tag including that file.

Unprocessed files can also be included at any point using `<script-partial>` tags.

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-asset-packager --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-asset-packager');
```

## The "asset_packager" task

### Overview
In your project's Gruntfile, add a section named `asset_packager` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  asset_packager: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.index
Type: `String`

Path to the index file containing package includes.

#### options.dest
Type: `String`
Default value: `'.'`

Path to the folder that will contained the final compiled index file and assets.

### Usage Example

In this example, index and asset files live within the `src` folder. These will be compiled to a new folder named `build`.

```js
grunt.initConfig({
  asset_packager: {
    options: {
	    index: 'src/index.html',
	    dest: 'build'
	   },
	   build: {
	    files: [
	    	{ src: ['src/asset_packages/**/*.pkg'], expand: true}
	    ]
	   }
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Peter Hastie. Licensed under the MIT license.
