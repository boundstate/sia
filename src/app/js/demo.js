(function () {

  angular.module('docsApp.demo', [])
    .directive('docsDemo', docsDemoDirective)
    .directive('demoFile', demoFileDirective)
    .directive('demoInclude', demoIncludeDirective)
    .filter('toHtml', toHtmlFilter);

  /* @ngInject */
  function docsDemoDirective() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'partials/docs-demo.html',
      transclude: true,
      controller: DocsDemoCtrl,
      controllerAs: 'demoCtrl',
      bindToController: true
    };

    /* @ngInject */
    function DocsDemoCtrl($scope, $attrs, $interpolate, codepen) {
      var ctrl = this;

      ctrl.interpolateCode = angular.isDefined($attrs.interpolateCode);
      ctrl.demoId = $interpolate($attrs.demoId || '')($scope.$parent);
      ctrl.demoTitle = $interpolate($attrs.demoTitle || '')($scope.$parent);
      ctrl.demoModule = $interpolate($attrs.demoModule || '')($scope.$parent);
      ctrl.files = {
        css: [], js: [], html: []
      };

      ctrl.addFile = function (name, contentsPromise) {
        var file = {
          name: convertName(name),
          contentsPromise: contentsPromise,
          fileType: name.split('.').pop()
        };
        contentsPromise.then(function (contents) {
          file.contents = contents;
        });

        if (name === 'index.html') {
          ctrl.files.index = file;
        } else if (name === 'readme.html') {
          ctrl.demoDescription = file;
        } else {
          ctrl.files[file.fileType] = ctrl.files[file.fileType] || [];
          ctrl.files[file.fileType].push(file);
        }

        ctrl.orderedFiles = []
          .concat(ctrl.files.index || [])
          .concat(ctrl.files.js || [])
          .concat(ctrl.files.css || [])
          .concat(ctrl.files.html || []);
      };

      ctrl.editOnCodepen = function () {
        codepen.editOnCodepen({
          title: ctrl.demoTitle,
          files: ctrl.files,
          id: ctrl.demoId,
          module: ctrl.demoModule
        });
      };

      function convertName(name) {
        switch (name) {
          case "index.html" :
            return "HTML";
          case "script.js" :
            return "JS";
          case "style.css" :
            return "CSS";
          default :
            return name;
        }
      }
    }
  }

  /* @ngInject */
  function demoFileDirective($q, $interpolate) {
    return {
      restrict: 'E',
      require: '^docsDemo',
      compile: compile
    };

    function compile(element, attr) {
      var contentsAttr = attr.contents;
      var html = element.html();
      var name = attr.name;

      element.contents().remove();

      return function postLink(scope, element, attr, docsDemoCtrl) {
        docsDemoCtrl.addFile(
          $interpolate(name)(scope),
          $q.when(scope.$eval(contentsAttr) || html)
        );
        element.remove();
      };
    }
  }

  /* @ngInject */
  function demoIncludeDirective($q, $compile, $templateCache, $timeout) {
    return {
      restrict: 'E',
      link: postLink
    };

    function postLink(scope, element, attr) {
      var demoContainer;

      // Interpret the expression given as `demo-include files="something"`
      var files = scope.$eval(attr.files) || {};
      var ngModule = scope.$eval(attr.module) || '';

      $timeout(handleDemoIndexFile);

      /**
       * Fetch the index file, and bootstrap a new angular app with that ngModule.
       */
      function handleDemoIndexFile() {
        files.index.contentsPromise.then(function (contents) {
          demoContainer = angular.element(
            '<div class="demo-content ' + ngModule + '">'
          );

          angular.bootstrap(demoContainer[0], [ngModule]);

          var demoScope = demoContainer.scope();
          var demoCompileService = demoContainer.injector().get('$compile');
          scope.$on('$destroy', function () {
            demoScope.$destroy();
          });

          // Once everything is loaded, put the demo into the DOM
          $q.all([
            handleDemoStyles(),
            handleDemoTemplates()
          ]).finally(function () {
            demoScope.$evalAsync(function () {
              element.append(demoContainer);
              demoContainer.html(contents);
              demoCompileService(demoContainer.contents())(demoScope);
            });
          });
        });

      }


      /**
       * Fetch the demo styles, and append them to the DOM.
       */
      function handleDemoStyles() {
        return $q.all(files.css.map(function (file) {
          return file.contentsPromise;
        }))
          .then(function (styles) {
            styles = styles.join('\n'); //join styles as one string

            var styleElement = angular.element('<style>' + styles + '</style>');
            document.body.appendChild(styleElement[0]);

            scope.$on('$destroy', function () {
              styleElement.remove();
            });
          });

      }

      /**
       * Fetch the templates for this demo, and put the templates into
       * the demo app's templateCache, with a url that allows the demo apps
       * to reference their templates local to the demo index file.
       *
       * For example, make it so the dialog demo can reference templateUrl
       * 'my-dialog.tmpl.html' instead of having to reference the url
       * 'generated/material.components.dialog/demo/demo1/my-dialog.tmpl.html'.
       */
      function handleDemoTemplates() {
        return $q.all(files.html.map(function (file) {

          return file.contentsPromise.then(function (contents) {
            // Get the $templateCache instance that goes with the demo's specific ng-app.
            var demoTemplateCache = demoContainer.injector().get('$templateCache');
            demoTemplateCache.put(file.name, contents);

            scope.$on('$destroy', function () {
              demoTemplateCache.remove(file.name);
            });

          });

        }));

      }

    }

  }

  /* @ngInject */
  function toHtmlFilter($sce) {
    return function (str) {
      return $sce.trustAsHtml(str);
    };
  }

})();
