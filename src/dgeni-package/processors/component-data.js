var _ = require('lodash');

/**
 * dgProcessor componentDataProcessor
 * @description
 * Generate `COMPONENTS` constant for components within documented modules
 */
module.exports = function componentDataProcessor() {
  return {
    repositoryUrl: null,
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process: process
  };

  function process(docs) {

    var repositoryBaseUrl = this.repositoryUrl && this.repositoryUrl + '/blob/master/src/';

    var components = _(docs)
      // We are not interested in docs that are not in a module
      .filter('module')
      .groupBy('module')
      .map(function (moduleDocs, moduleName) {

        var moduleDoc = _.find(docs, {
          docType: 'module',
          name: moduleName
        });
        if (!moduleDoc) return;

        return buildComponentData(moduleDoc, {
          docs: moduleDocs
            .filter(function (doc) {
              return doc.docType !== 'module';
            })
            .map(buildComponentData)
        });

      })
      .filter() //remove null items
      .value();

    docs.push({
      module: 'docsApp.component-data',
      name: 'COMPONENTS',
      template: 'constant-data.template.js',
      outputPath: 'js/component-data.js',
      data: components
    });

    /**
     * Build data for components.
     * @param {object} doc
     * @param {object} [options]
     * @returns {*}
     */
    function buildComponentData(doc, options) {
      return _.assign({
        name: doc.name,
        type: doc.docType,
        outputPath: doc.outputPath,
        url: doc.path,
        hasDemo: doc.docType === 'directive',
        repositoryUrl: repositoryBaseUrl && repositoryBaseUrl + doc.fileInfo.relativePath
      }, options || {});
    }

  }

};
