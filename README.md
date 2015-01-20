# grunt-asset-packager [![Build Status](https://travis-ci.org/sillypog/grunt-asset-packager.png?branch=master)](https://travis-ci.org/sillypog/grunt-asset-packager) [![Dependency Status](https://david-dm.org/sillypog/grunt-asset-packager.png)](https://david-dm.org/sillypog/grunt-asset-packager) [![devDependency Status](https://david-dm.org/sillypog/grunt-asset-packager/dev-status.png)](https://david-dm.org/sillypog/grunt-asset-packager#info=devDependencies)

> Packages javascript and stylesheets similarly to the Rails asset pipeline.

## Why use asset-packager?
This task makes it easy to compile local and production versions of a static site. Rather than putting stylesheet and javascript includes directly in the html file they are put into package files; it is the package files that are referenced from the html file.

For example, a package file named `common.js` might contain the following lines:
```
src/js/ file1.js
src/js/ file2.js
```

`index.html` would then have this tag referencing that package:
```html
<script-package src="common.js" />
```

When the task is run in DEVELOPMENT mode, the javascript files will be copied to the build directory and the `<script-package>` tag replaced by `<script>` tags including each file.

When the task is run in PRODUCTION mode, the javascript files will be concatenated and uglified into a single file named `common.js` and the `<script-package>` tag replaced by a single `<script>` tag including that file.

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

For static site projects with a single html file defining all script and style includes. This sets the path to the index file containing package includes.

#### options.dest
Type: `String`
Default value: `'.'`

For static site projects with a single html file defining all script and style includes. This sets the path to the folder that will contained the final compiled index file and assets.

#### options.js.source
Type: `String`

For projects with js includes defined in multiple files. This sets the path to write javascript source files to.

#### options.js.includes
Type: `String`

For projects with js includes defined in multiple files. This sets the path to write the files containing the `<script>` tags. The include files will have the name of the asset package, for example main.js.pkg generates an include file named main.html.

#### options.asset_path_separator
Type: `String`
Default value: `' '`

Allows normalization of filepaths between builds of different modes. In package files, anything after this character will be copied into the build directory.

Eg, if the path in the asset folder is written as:
src/js/ module/file.js

The build directory will contain:
module/file.js

#### options.output_prefix
Type: `Object`
Default value: `{ js: 'js', css: 'css' }`

Group files in the build directory under these folders, eg:
js/module/file.js
css/module/file.css

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

## Setting the mode

asset_packager expects a grunt config variable named 'mode' to be set to either
'DEVELOPMENT' or 'PRODUCTION'. Below is an example of how this can be done.

```
// Allow setting the global config that is read by asset_packager
grunt.registerTask('set_config', 'Set a config property.', function(name, val){
  grunt.config.set(name, val);
});

grunt.registerTask('dev', ['set_config:mode:DEVELOPMENT', 'asset_packager']);
grunt.registerTask('prod', ['set_config:mode:PRODUCTION', 'asset_packager']);
```

The mode must be set, there is no default option.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Peter Hastie. Licensed under the MIT license.
