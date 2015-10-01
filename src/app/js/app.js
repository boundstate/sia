var DocsApp = angular.module('docsApp', [ 'docsApp.config', 'docsApp.demos', 'ngRoute', 'ngMessages', 'ngMaterial' ])

.config([
  'SERVICES',
  'COMPONENTS',
  'DEMOS',
  'PAGES',
  '$routeProvider',
  '$mdThemingProvider',
function(SERVICES, COMPONENTS, DEMOS, PAGES, $routeProvider, $mdThemingProvider) {
  $routeProvider
    .when('/demo/', {
      redirectTo: function() {
        return DEMOS[0].url;
      }
    })
    .when('/api/', {
      redirectTo: function() {
        return COMPONENTS[0].docs[0].url;
      }
    });

  $mdThemingProvider.definePalette('docs-blue', $mdThemingProvider.extendPalette('blue', {
    '50':   '#DCEFFF',
    '100':  '#AAD1F9',
    '200':  '#7BB8F5',
    '300':  '#4C9EF1',
    '400':  '#1C85ED',
    '500':  '#106CC8',
    '600':  '#0159A2',
    '700':  '#025EE9',
    '800':  '#014AB6',
    '900':  '#013583',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': '50 100 200 A100',
    'contrastStrongLightColors': '300 400 A200 A400'
  }));
  $mdThemingProvider.definePalette('docs-red', $mdThemingProvider.extendPalette('red', {
    'A100': '#DE3641'
  }));

  $mdThemingProvider.theme('docs-dark', 'default')
    .primaryPalette('yellow')
    .dark();

  $mdThemingProvider.theme('default')
    .primaryPalette('docs-blue')
    .accentPalette('docs-red');

  angular.forEach(PAGES, function(pages, area) {
    angular.forEach(pages, function(page) {
      $routeProvider
        .when(page.url, {
          templateUrl: page.outputPath,
          controller: 'GuideCtrl'
        });
    });
  });

  angular.forEach(COMPONENTS, function(component) {
    angular.forEach(component.docs, function(doc) {
      doc.url = '/' + doc.url;
      $routeProvider.when(doc.url, {
        templateUrl: doc.outputPath,
        resolve: {
          component: function() { return component; },
          doc: function() { return doc; }
        },
        controller: 'ComponentDocCtrl'
      });
    });
  });

  angular.forEach(SERVICES, function(service) {
    service.url = '/' + service.url;
    $routeProvider.when(service.url, {
      templateUrl: service.outputPath,
      resolve: {
        component: function() { return undefined; },
        doc: function() { return service; }
      },
      controller: 'ComponentDocCtrl'
    });
  });

  angular.forEach(DEMOS, function(componentDemos) {
    var demoComponent;
    angular.forEach(COMPONENTS, function(component) {
      if (componentDemos.name === component.name) {
        demoComponent = component;
      }
    });
    demoComponent = demoComponent || angular.extend({}, componentDemos);
    $routeProvider.when(componentDemos.url, {
      templateUrl: 'partials/demo.tmpl.html',
      controller: 'DemoCtrl',
      resolve: {
        component: function() { return demoComponent; },
        demos: function() { return componentDemos.demos; }
      }
    });
  });

  $routeProvider.otherwise(PAGES.main[0].url);
}])

.factory('menu', [
  'SERVICES',
  'COMPONENTS',
  'DEMOS',
  'PAGES',
  '$location',
  '$rootScope',
  '$http',
  '$window',
function(SERVICES, COMPONENTS, DEMOS, PAGES, $location, $rootScope, $http, $window) {

  var version = {};
  var sections = [];

  angular.forEach(PAGES.main, function(page) {
    sections.push({
      name: page.label,
      url: page.url,
      type: 'link'
    });
  });

  var demoDocs = [];
  angular.forEach(DEMOS, function(componentDemos) {
    demoDocs.push({
      name: componentDemos.label,
      url: componentDemos.url
    });
  });


  if (demoDocs.length > 0) {
    sections.push({
      name: 'Demos',
      pages: demoDocs.sort(sortByName),
      type: 'toggle'
    });
  }

  sections.push();

  var docsByModule = {};
  var apiDocs = {};
  COMPONENTS.forEach(function(component) {
    component.docs.forEach(function(doc) {
      if (angular.isDefined(doc.private)) return;
      apiDocs[doc.type] = apiDocs[doc.type] || [];
      apiDocs[doc.type].push(doc);

      docsByModule[doc.module] = docsByModule[doc.module] || [];
      docsByModule[doc.module].push(doc);
    });
  });

  SERVICES.forEach(function(service) {
    if (angular.isDefined(service.private)) return;
    apiDocs[service.type] = apiDocs[service.type] || [];
    apiDocs[service.type].push(service);

    docsByModule[service.module] = docsByModule[service.module] || [];
    docsByModule[service.module].push(service);
  });

  var apiSections = [];

  if (apiDocs.service) {
    apiSections.push({
      name: 'Services',
      pages: apiDocs.service.sort(sortByName),
      type: 'toggle'
    });
  }

  if (apiDocs.directive) {
    apiSections.push({
      name: 'Directives',
      pages: apiDocs.directive.sort(sortByName),
      type: 'toggle'
    });
  }

  sections.push({
    name: 'API Reference',
    type: 'heading',
    children: apiSections
  });

  function sortByName(a,b) {
    return a.name < b.name ? -1 : 1;
  }

  var self;

  $rootScope.$on('$locationChangeSuccess', onLocationChange);

  $http.get("/docs.json")
      .success(function(response) {
        var versionId = getVersionIdFromPath();
        var head = { type: 'version', url: '/HEAD', id: 'head', name: 'HEAD (master)', github: '' };
        var commonVersions = versionId === 'head' ? [] : [ head ];
        var knownVersions = getAllVersions();
        var listVersions = knownVersions.filter(removeCurrentVersion);
        var currentVersion = getCurrentVersion();
        version.current = currentVersion;
        sections.unshift({
          name: 'Documentation Version',
          type: 'heading',
          className: 'version-picker',
          children: [ {
            name: currentVersion.name,
            type: 'toggle',
            pages: commonVersions.concat(listVersions)
          } ]
        });
        function removeCurrentVersion (version) {
          switch (versionId) {
            case version.id: return false;
            case 'latest': return !version.latest;
            default: return true;
          }
        }
        function getAllVersions () {
          return response.versions.map(function(version) {
            var latest = response.latest === version;
            return {
              type: 'version',
              url: '/' + version,
              name: getVersionFullString({ id: version, latest: latest }),
              id: version,
              latest: latest,
              github: 'tree/v' + version
            };
          });
        }
        function getVersionFullString (version) {
          return version.latest
              ? 'Latest Release (' + version.id + ')'
              : 'Release ' + version.id;
        }
        function getCurrentVersion () {
          switch (versionId) {
            case 'head': return head;
            case 'latest': return knownVersions.filter(getLatest)[0];
            default: return knownVersions.filter(getVersion)[0];
          }
          function getLatest (version) { return version.latest; }
          function getVersion (version) { return versionId === version.id; }
        }
        function getVersionIdFromPath () {
          var path = $window.location.pathname;
          if (path.length < 2) path = 'HEAD';
          return path.match(/[^\/]+/)[0].toLowerCase();
        }
      });

  return self = {
    version:  version,
    sections: sections,

    selectSection: function(section) {
      self.openedSection = section;
    },
    toggleSelectSection: function(section) {
      self.openedSection = (self.openedSection === section ? null : section);
    },
    isSectionSelected: function(section) {
      return self.openedSection === section;
    },

    selectPage: function(section, page) {
      self.currentSection = section;
      self.currentPage = page;
    },
    isPageSelected: function(page) {
      return self.currentPage === page;
    }
  };

  function sortByHumanName(a,b) {
    return (a.humanName < b.humanName) ? -1 :
      (a.humanName > b.humanName) ? 1 : 0;
  }

  function onLocationChange() {
    var path = $location.path();
    var introLink = {
      name: "Introduction",
      url:  "/",
      type: "link"
    };

    if (path == '/') {
      self.selectSection(introLink);
      self.selectPage(introLink, introLink);
      return;
    }

    var matchPage = function(section, page) {
      if (path === page.url) {
        self.selectSection(section);
        self.selectPage(section, page);
      }
    };

    sections.forEach(function(section) {
      if(section.children) {
        // matches nested section toggles, such as API or Customization
        section.children.forEach(function(childSection){
          if(childSection.pages){
            childSection.pages.forEach(function(page){
              matchPage(childSection, page);
            });
          }
        });
      }
      else if(section.pages) {
        // matches top-level section toggles, such as Demos
        section.pages.forEach(function(page) {
          matchPage(section, page);
        });
      }
      else if (section.type === 'link') {
        // matches top-level links, such as "Getting Started"
        matchPage(section, section);
      }
    });
  }
}])

.directive('menuLink', function() {
  return {
    scope: {
      section: '='
    },
    templateUrl: 'partials/menu-link.tmpl.html',
    link: function($scope, $element) {
      var controller = $element.parent().controller();

      $scope.isSelected = function() {
        return controller.isSelected($scope.section);
      };
    }
  };
})

.directive('menuToggle', [ '$timeout', function($timeout) {
  return {
    scope: {
      section: '='
    },
    templateUrl: 'partials/menu-toggle.tmpl.html',
    link: function($scope, $element) {
      var controller = $element.parent().controller();

      $scope.isOpen = function() {
        return controller.isOpen($scope.section);
      };
      $scope.toggle = function() {
        controller.toggleOpen($scope.section);
      };
      $scope.$watch(
          function () {
            return controller.isOpen($scope.section);
          },
          function (open) {
            var $ul = $element.find('ul');
            var targetHeight = open ? getTargetHeight() : 0;
            $timeout(function () {
              $ul.css({ height: targetHeight + 'px' });
            }, 0, false);

            function getTargetHeight () {
              var targetHeight;
              $ul.addClass('no-transition');
              $ul.css('height', '');
              targetHeight = $ul.prop('clientHeight');
              $ul.css('height', 0);
              $ul.removeClass('no-transition');
              return targetHeight;
            }
          }
      );


      var parentNode = $element[0].parentNode.parentNode.parentNode;
      if(parentNode.classList.contains('parent-list-item')) {
        var heading = parentNode.querySelector('h2');
        $element[0].firstChild.setAttribute('aria-describedby', heading.id);
      }
    }
  };
}])

.controller('DocsCtrl', [
  '$scope',
  'COMPONENTS',
  'CONFIG',
  '$mdSidenav',
  '$timeout',
  '$mdDialog',
  'menu',
  '$location',
  '$rootScope',
  '$window',
  '$log',
function($scope, COMPONENTS, CONFIG, $mdSidenav, $timeout, $mdDialog, menu, $location, $rootScope, $window, $log) {
  var self = this;

  $scope.COMPONENTS = COMPONENTS;
  $scope.CONFIG = CONFIG;
  $scope.menu = menu;

  $scope.path = path;
  $scope.goHome = goHome;
  $scope.openMenu = openMenu;
  $scope.closeMenu = closeMenu;
  $scope.isSectionSelected = isSectionSelected;

  $rootScope.$on('$locationChangeSuccess', openPage);

  //-- Define a fake model for the related page selector
  Object.defineProperty($rootScope, "relatedPage", {
    get: function () { return null; },
    set: angular.noop,
    enumerable: true,
    configurable: true
  });
  $rootScope.redirectToUrl = function (url) {
    $window.location.hash = url;
    $timeout(function () { $rootScope.relatedPage = null; }, 100);
  };

  // Methods used by menuLink and menuToggle directives
  this.isOpen = isOpen;
  this.isSelected = isSelected;
  this.toggleOpen = toggleOpen;

  // *********************
  // Internal methods
  // *********************

  function closeMenu() {
    $timeout(function() { $mdSidenav('left').close(); });
  }

  function openMenu() {
    $timeout(function() { $mdSidenav('left').open(); });
  }

  function path() {
    return $location.path();
  }

  function goHome($event) {
    menu.selectPage(null, null);
    $location.path( '/' );
  }

  function openPage() {
    $scope.closeMenu();
  }

  function isSelected(page) {
    return menu.isPageSelected(page);
  }

  function isSectionSelected(section) {
    var selected = false;
    var openedSection = menu.openedSection;
    if(openedSection === section){
      selected = true;
    }
    else if(section.children) {
      section.children.forEach(function(childSection) {
        if(childSection === openedSection){
          selected = true;
        }
      });
    }
    return selected;
  }

  function isOpen(section) {
    return menu.isSectionSelected(section);
  }

  function toggleOpen(section) {
    menu.toggleSelectSection(section);
  }
}])

.controller('HomeCtrl', [
  '$scope',
  '$rootScope',
function($scope, $rootScope) {
  $rootScope.currentComponent = $rootScope.currentDoc = null;
}])


.controller('GuideCtrl', [
  '$rootScope',
function($rootScope) {
  $rootScope.currentComponent = $rootScope.currentDoc = null;
}])

.controller('LayoutCtrl', [
  '$scope',
  '$attrs',
  '$location',
  '$rootScope',
function($scope, $attrs, $location, $rootScope) {
  $rootScope.currentComponent = $rootScope.currentDoc = null;

  $scope.exampleNotEditable = true;
  $scope.layoutDemo = {
    mainAxis: 'center',
    crossAxis: 'center',
    direction: 'row'
  };
  $scope.layoutAlign = function() {
    return $scope.layoutDemo.mainAxis + ' ' + $scope.layoutDemo.crossAxis;
  };
}])

.controller('ComponentDocCtrl', [
  '$scope',
  'doc',
  'component',
  '$rootScope',
function($scope, doc, component, $rootScope) {
  $rootScope.currentComponent = component;
  $rootScope.currentDoc = doc;
}])

.controller('DemoCtrl', [
  '$rootScope',
  '$scope',
  'component',
  'demos',
  '$http',
  '$templateCache',
function($rootScope, $scope, component, demos, $http, $templateCache) {
  $rootScope.currentComponent = component;
  $rootScope.currentDoc = null;

  $scope.demos = [];

  angular.forEach(demos, function(demo) {
    // Get displayed contents (un-minified)
    var files = [demo.index]
      .concat(demo.js || [])
      .concat(demo.css || [])
      .concat(demo.html || []);
    files.forEach(function(file) {
      file.httpPromise =$http.get(file.outputPath, {cache: $templateCache})
        .then(function(response) {
          file.contents = response.data
            .replace('<head/>', '');
          return file.contents;
        });
    });
    demo.$files = files;
    $scope.demos.push(demo);
  });

  $scope.demos = $scope.demos.sort(function(a,b) {
    return a.name > b.name ? 1 : -1;
  });

}])

.filter('nospace', function () {
  return function (value) {
    return (!value) ? '' : value.replace(/ /g, '');
  };
})
.filter('humanizeDoc', function() {
  return function(doc) {
    if (!doc) return;
    if (doc.type === 'directive') {
      return doc.name.replace(/([A-Z])/g, function($1) {
        return '-'+$1.toLowerCase();
      });
    }
    return doc.label || doc.name;
  };
})

.filter('directiveBrackets', function() {
  return function(str) {
    if (str.indexOf('-') > -1) {
      return '<' + str + '>';
    }
    return str;
  };
});
