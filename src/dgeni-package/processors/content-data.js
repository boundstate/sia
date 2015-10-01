var _ = require('lodash');

/**
 * dgProcessor contentDataProcessor
 * @description
 * Generates `PAGES` constant for comments with a `docType` of "content".
 */
module.exports = function contentDataProcessor() {
  return {
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process: process
  };

  function process(docs) {
    var contentDocs = _(docs)
      .filter({docType: 'content'})
      .groupBy('area')
      .mapValues(function(areaDocs) {
        return _.map(areaDocs, function(areaDoc) {
          return {
            name: areaDoc.name,
            outputPath: areaDoc.outputPath,
            url: '/' + areaDoc.path,
            label: areaDoc.label || areaDoc.name
          };
        });
      }).
      value();

    docs.push({
      name: 'PAGES',
      template: 'constant-data.template.js',
      outputPath: 'js/content-data.js',
      data: contentDocs
    });
  }
};
