var path = require('canonical-path');

var packagePath = __dirname;

var Package = require('dgeni').Package;

module.exports = new Package('sia', [
  require('dgeni-packages/ngdoc'),
  require('dgeni-packages/nunjucks')
])

.processor(require('./processors/component-data'))
.processor(require('./processors/page-data'))

.config(function(templateEngine, templateFinder) {
  templateFinder.templateFolders = [
    path.resolve(packagePath, 'templates'),
    path.resolve(packagePath, 'templates/ngdoc')
  ];
})

.config(function(readFilesProcessor, writeFilesProcessor) {
  readFilesProcessor.sourceFiles = [
    {include: 'src/**/*.js', basePath: 'src'},
    {include: 'docs/**/*', basePath: 'docs', fileReader: 'ngdocFileReader'},
  ];
  writeFilesProcessor.outputFolder = 'dist/docs';
})

.config(function(computeIdsProcessor, computePathsProcessor) {

  computeIdsProcessor.idTemplates.push({
    docTypes: ['content'],
    idTemplate: 'content-${fileInfo.relativePath.replace("/","-")}',
    getAliases: function(doc) { return [doc.id]; }
  });

  computePathsProcessor.pathTemplates.push({
    docTypes: ['content'],
    getPath: function(doc) {
      var docPath = path.dirname(doc.fileInfo.relativePath);
      return path.join(docPath, doc.fileInfo.baseName);
    },
    getOutputPath: function(doc) {
      var docPath = path.dirname(doc.fileInfo.relativePath);
      return path.join('partials', docPath, doc.fileInfo.baseName) + '.html';
    }
  });
})

.config(function(generateComponentGroupsProcessor) {
  generateComponentGroupsProcessor.$enabled = false;
});
