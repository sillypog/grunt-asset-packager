'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.asset_packager = {
  setUp: function (done) {
    // setup here if necessary
    done();
  },
  dev: function (test) {
    test.expect(4);
	
	test.ok(grunt.file.exists('tmp/dev'), 'should create dev directory.');
	
	test.ok(grunt.file.exists('tmp/dev/index.html'), 'should copy index.html.');
	test.equal(grunt.file.read('tmp/dev/index.html'), grunt.file.read('test/expected/dev/index.html'), 'should correctly format index.html');
	
	var jsFilesExist = grunt.file.exists('tmp/dev/test/fixtures/js/file1.js') && grunt.file.exists('tmp/dev/test/fixtures/js/file2.js');
	test.ok(jsFilesExist, 'should copy js files');

    test.done();
  },
  prod: function (test) {
    test.expect(7);

    test.ok(grunt.file.exists('tmp/prod'), 'should create dev directory.');
	
	test.ok(grunt.file.exists('tmp/prod/index.html'), 'should copy index.html.');
	test.equal(grunt.file.read('tmp/prod/index.html'), grunt.file.read('test/expected/prod/index.html'), 'should correctly format index.html');
	
	test.ok(grunt.file.exists('tmp/prod/common.js'), 'should create packaged js file');
	var actualPackagedJS = grunt.file.read('tmp/prod/common.js'),
	    expectedPackagedJS = grunt.file.read('test/expected/prod/common.js'),
	    actualLines = actualPackagedJS.split(grunt.util.linefeed),
	    expectedLines = expectedPackagedJS.split(grunt.util.linefeed);
	test.equal(actualLines.length, 2, 'packaged js should contain 2 lines.');
	test.equal(actualLines[1], expectedLines[1], 'should concat and uglify javascript');
	test.ok(/\/\/Generated at \d\d-\d\d-\d\d\d\d \d?\d:\d\d:\d\d [A|P]M/.test(actualLines[0]), 'should include banner in packaged javascript'); 

    test.done();
  }
};
