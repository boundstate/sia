(function () {

  angular.module('docsApp.codepen', [])
    .factory('codepenDataAdapter', CodepenDataAdapter)
    .factory('codepen', Codepen);

  // Translates demo metadata and files into Codepen's post form data.  See api documentation for
  // additional fields not used by this service. http://blog.codepen.io/documentation/api/prefill
  /* @ngInject */
  function CodepenDataAdapter(CONFIG) {

    return {
      translate: translate
    };

    // Translates a demo model to match Codepen's post data
    // See http://blog.codepen.io/documentation/api/prefill
    function translate(demo) {
      var files = demo.files;

      return {
        title: demo.title,
        html: processHtml(demo),

        js: processJs(files.js),
        css: mergeFiles(files.css).join(' '),

        js_external: (CONFIG.codepen.externalJs || []).join(';'),
        css_external: (CONFIG.codepen.externalCss || []).join(';')
      };
    }

    // Modifies index.html with necessary changes in order to display correctly in codepen
    // See each processor to determine how each modifies the html
    function processHtml(demo) {
      var index = demo.files.index.contents;

      var processors = [
        insertTemplatesAsScriptTags,
        htmlEscapeAmpersand
      ];

      processors.forEach(function (processor) {
        index = processor(index, demo);
      });

      return index;
    }

    // Applies modifications the javascript prior to sending to codepen.
    // Currently merges js files
    function processJs(jsFiles) {
      return mergeFiles(jsFiles).join(' ');
    }

    // Maps file contents to an array
    function mergeFiles(files) {
      return files.map(function (file) {
        return file.contents;
      });
    }

    // Adds templates inline in the html, so that templates are cached in the example
    function insertTemplatesAsScriptTags(indexHtml, demo) {
      if (demo.files.html.length) {
        var tmp = angular.element(indexHtml);
        angular.forEach(demo.files.html, function (template) {
          tmp.append("<script type='text/ng-template' id='" +
            template.name + "'>" +
            template.contents +
            "</script>");
        });
        return tmp[0].outerHTML;
      }
      return indexHtml;
    }

    // Escapes ampersands so that after codepen unescapes the html the escaped code block
    // uses the correct escaped characters
    function htmlEscapeAmpersand(html) {
      return html.replace(/&/g, "&amp;");
    }
  }

  // Provides a service to open a code example in codepen.
  /* @ngInject */
  function Codepen($document, codepenDataAdapter) {

    var CODEPEN_API = 'https://codepen.io/pen/define/';

    return {
      editOnCodepen: editOnCodepen
    };

    // Creates a codepen from the given demo model by posting to Codepen's API
    // using a hidden form.  The hidden form is necessary to avoid a CORS issue.
    // See http://blog.codepen.io/documentation/api/prefill
    function editOnCodepen(demo) {
      var data = codepenDataAdapter.translate(demo);
      var form = buildForm(data);
      $document.find('body').append(form);
      form[0].submit();
      form.remove();
    }

    // Builds a hidden form with data necessary to create a codepen.
    function buildForm(data) {
      var form = angular.element(
        '<form style="display: none;" method="post" target="_blank" action="' +
        CODEPEN_API +
        '"></form>'
      );
      var input = '<input type="hidden" name="data" value="' + escapeJsonQuotes(data) + '" />';
      form.append(input);
      return form;
    }

    // Recommended by Codepen to escape quotes.
    // See http://blog.codepen.io/documentation/api/prefill
    function escapeJsonQuotes(json) {
      return JSON.stringify(json)
        .replace(/'/g, "&amp;apos;")
        .replace(/"/g, "&amp;quot;");
    }
  }

})();
