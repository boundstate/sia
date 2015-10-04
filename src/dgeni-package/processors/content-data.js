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
      .map(function(doc) {
        return {
          name: doc.name,
          area: doc.area,
          outputPath: doc.outputPath,
          url: doc.path == 'index' ? '' : doc.path,
          label: doc.label || doc.name
        };
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
