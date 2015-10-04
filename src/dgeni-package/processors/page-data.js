var _ = require('lodash');

/**
 * dgProcessor pageDataProcessor
 * @description
 * Generates `PAGES` constant for comments with a `docType` of "content".
 */
module.exports = function pageDataProcessor() {
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
      module: 'docsApp.page-data',
      name: 'PAGES',
      template: 'constant-data.template.js',
      outputPath: 'js/page-data.js',
      data: contentDocs
    });
  }
};
