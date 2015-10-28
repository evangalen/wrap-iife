var path = require('path');
var assert = require('assert');
var sinon = require('sinon');

var sourceMap = require('source-map');
var SourceMapGenerator = sourceMap.SourceMapGenerator;

var testFilePath = '/absolute/file/path';
var testContentsOriginal = '' +
    "'use strict';\n" +
    '\n' +
    'doSomething();';

var testContentsIndented = '' +
    "'use strict';\n" +
    '\n' +
    '    doSomething();';

var pathRelativeStub = sinon.stub(path, 'relative').returns('a/relative/path');

var wrapIife = require('../index');


describe('wrap-iife', function () {

    it('should wrap without a source map', function () {
        var result = wrapIife(testFilePath, testContentsOriginal);
        assert.equal(result.contents, '!(function() { ' + testContentsOriginal + '\n}());');
        assert.equal(result.sourceMap, undefined);
    });

    it('should wrap with a source map', function () {
        var result = wrapIife(testFilePath, testContentsOriginal, {sourceMaps: true});
        assert.equal(result.contents, '!(function() { ' + testContentsOriginal + '\n}());');
        assert.deepEqual(result.sourceMap,
            {version:3, sources: ['a/relative/path'], names: [], mappings: 'A,eAAA;AACA;AACA'});
    });

    it('should wrap with a source map and use existing source maps', function () {
        var map = new SourceMapGenerator();
        map.addMapping({source: 'a/relative/path', original: {line: 1, column: 0}, generated: {line: 1, column: 0}});
        map.addMapping({source: 'a/relative/path', original: {line: 2, column: 0}, generated: {line: 2, column: 0}});
        map.addMapping({source: 'a/relative/path', original: {line: 2, column: 0}, generated: {line: 3, column: 4}});

        var result = wrapIife(testFilePath, testContentsIndented,
            {sourceMaps: true, inputSourceMap: JSON.parse(map.toString())});

        assert.equal(result.contents, '!(function() { ' + testContentsIndented + '\n}());');
        assert.deepEqual(result.sourceMap,
            {version:3, sources: ['a/relative/path'], names: [], mappings: 'AAAA,A,eAAA;AACA;AACA,IADA'});
    });

});
