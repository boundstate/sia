var _ = require('lodash');

/**
 * dgProcessor componentsDataProcessor
 * @description
 * Generate constants for components:
 *  - `SERVICES`: services part of the core module
 *  - `COMPONENTS`: all other components, grouped by module
 */
module.exports = function componentsDataProcessor() {
  return {
    modulePrefix: null,
    repositoryUrl: null,
    $validate: {
      modulePrefix: { presence: true },
    },
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process: process
  };

  function process(docs) {

    var modulePrefix = this.modulePrefix;
    var repositoryUrl = this.repositoryUrl;

    var coreServices = _(docs)
      .filter(function (doc) {
        return doc.docType == 'service' && doc.module == modulePrefix + '.core';
      })
      .map(buildCoreServiceData)
      .value();

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
      name: 'SERVICES',
      template: 'constant-data.template.js',
      outputPath: 'js/services-data.js',
      data: coreServices
    });

    docs.push({
      name: 'COMPONENTS',
      template: 'constant-data.template.js',
      outputPath: 'js/components-data.js',
      data: components
    });

    /**
     * Build data for core services.
     * @param {object} doc
     * @param {object} [extraData]
     * @returns {*}
     */
    function buildCoreServiceData(doc, extraData) {
      var options = _.assign(extraData || {}, {hasDemo: false});
      return buildDocData(doc, options, 'core');
    }

    /**
     * Build data for components.
     * @param {object} doc
     * @param {object} [extraData]
     * @returns {*}
     */
    function buildComponentData(doc, extraData) {
      var options = _.assign(extraData || {}, {hasDemo: (doc.docType === 'directive')});
      return buildDocData(doc, options, 'components');
    }

    /**
     * Build documentation data.
     * @param {object} doc
     * @param {object} [extraData]
     * @param {string} descriptor
     * @returns {*}
     */
    function buildDocData(doc, extraData, descriptor) {
      var module = modulePrefix + '.' + descriptor;
      var repositoryBaseUrl = repositoryUrl && repositoryUrl + '/blob/master/src/' + descriptor + '/';
      doc.module.split(module + '.').pop(); // remove jsName

      var basePathFromProjectRoot = 'src/' + descriptor + '/';
      var filePath = doc.fileInfo.filePath;
      var indexOfBasePath = filePath.indexOf(basePathFromProjectRoot);
      var path = filePath.substr(indexOfBasePath + basePathFromProjectRoot.length, filePath.length);

      return _.assign({
        name: doc.name,
        type: doc.docType,
        outputPath: doc.outputPath,
        url: doc.path,
        label: doc.label || doc.name,
        module: module,
        repositoryUrl: repositoryBaseUrl && repositoryBaseUrl + path
      }, extraData);
    }

  }

};
