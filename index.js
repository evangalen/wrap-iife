'use strict';

var path = require('path');

var sourceMap = require('source-map');
var convertSourceMap = require('convert-source-map');

var SourceMapGenerator = sourceMap.SourceMapGenerator;
var SourceMapConsumer = sourceMap.SourceMapConsumer;

/**
 * @param {string} filePath
 * @param {string} contents
 * @param {{sourceMaps: boolean, inputSourceMap: object, basePath: string}=} config
 * @returns {{contents: string, sourceMap: (undefined|object)}}
 */
function wrapIife(filePath, contents, config) {
    var sourceMaps = config && config.sourceMaps || false;
    var inputSourceMap = config && config.inputSourceMap;
    var basePath = config && config.basePath || '.';

    var iifeBegin = '!(function() { ';
    var iifeEnd = '}());';

    var map = new SourceMapGenerator();

    var sourceRelativePath = path.relative(basePath, filePath);

    // add source map mapping for `iifeBegin` that will be pre-pended to the contents
    map.addMapping({source: null, original: null, generated: {line: 1, column: 0}});

    // add source map mapping for the original code of the first line
    map.addMapping({
        source: sourceRelativePath,
        original: {line: 1, column: 0},
        generated: {line: 1, column: iifeBegin.length}
    });

    var lineNumber = 2;
    var newLineIndexOf;

    newLineIndexOf = contents.indexOf('\n', 0);
    while (newLineIndexOf !== -1) {
        map.addMapping({
            source: sourceRelativePath,
            original: {line: lineNumber, column: 0},
            generated: {line: lineNumber, column: 0}
        });

        lineNumber++;
        newLineIndexOf = contents.indexOf('\n', newLineIndexOf + 1);
    }

    var lastCharacter = contents[contents.length - 1];

    var modifiedContents = iifeBegin + contents + (lastCharacter !== '\n' ? '\n' : '') + iifeEnd;

    var sourceMapJSON = null;

    if (sourceMaps) {
        if (inputSourceMap) {
            sourceMapJSON = mergeSourceMap(sourceRelativePath, inputSourceMap, map.toString())
        } else {
            sourceMapJSON = map.toString();
        }
    }

    return {contents: modifiedContents, sourceMap: sourceMaps ? JSON.parse(sourceMapJSON) : null};


    function mergeSourceMap(sourceRelativePath, inputSourceMap, sourceMapJSON) {
        var generator = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(inputSourceMap));

        var sourceMap = JSON.parse(sourceMapJSON);
        sourceMap.file = sourceRelativePath;

        generator.applySourceMap(new SourceMapConsumer(sourceMap));

        return generator.toString();
    }
}


module.exports = wrapIife;
