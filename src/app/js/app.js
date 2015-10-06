(function () {

  angular.module('docsApp', [
    'ngRoute',
    'ngMessages',
    'ngMaterial',

    'docsApp.codepen',
    'docsApp.demo',
    'docsApp.hljs',
    'docsApp.templates',

    'docsApp.component-data',
    'docsApp.config-data',
    'docsApp.demo-data',
    'docsApp.page-data'
  ])
    .config(configure)
    .factory('menu', menuService)
    .directive('menuLink', menuLinkDirective)
    .directive('menuToggle', menuToggleDirective)
    .controller('DocsCtrl', DocsCtrl)
    .controller('GuideCtrl', GuideCtrl)
    .controller('ComponentDocCtrl', ComponentDocCtrl)
    .controller('DemoCtrl', DemoCtrl)
    .filter('nospace', nospaceFilter)
    .filter('humanizeDoc', humanizeDocFilter)
    .filter('directiveBrackets', directiveBracketsFilter);

  /* @ngInject */
  function configure(COMPONENTS, DEMOS, PAGES, $locationProvider, $routeProvider, $mdThemingProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
    $routeProvider
      .when('/demo/', {
        redirectTo: function () {
          return DEMOS[0].url;
        }
      })
      .when('/api/', {
        redirectTo: function () {
          return COMPONENTS[0].docs[0].url;
        }
      });

    angular.forEach(PAGES, function (page) {
      $routeProvider.when('/' + page.url, {
        templateUrl: page.outputPath,
        controller: 'GuideCtrl'
      });
    });

    angular.forEach(COMPONENTS, function (component) {
      angular.forEach(component.docs, function (doc) {
        $routeProvider.when('/' + doc.url, {
          templateUrl: doc.outputPath,
          resolve: {
            component: function () {
              return component; // undefined for core services?
            },
            doc: function () {
              return doc;
            }
          },
          controller: 'ComponentDocCtrl'
        });
      });
    });

    angular.forEach(DEMOS, function (componentDemos) {
      var demoComponent;
      angular.forEach(COMPONENTS, function (component) {
        if (componentDemos.name === component.name) {
          demoComponent = component;
        }
      });
      demoComponent = demoComponent || angular.extend({}, componentDemos);
      $routeProvider.when('/' + componentDemos.url, {
        templateUrl: 'partials/demo.html',
        controller: 'DemoCtrl',
        resolve: {
          component: function () {
            return demoComponent;
          },
          demos: function () {
            return componentDemos.demos;
          }
        }
      });
    });

    // Theme
    $mdThemingProvider.definePalette('docs-blue', $mdThemingProvider.extendPalette('blue', {
      '50': '#DCEFFF',
      '100': '#AAD1F9',
      '200': '#7BB8F5',
      '300': '#4C9EF1',
      '400': '#1C85ED',
      '500': '#106CC8',
      '600': '#0159A2',
      '700': '#025EE9',
      '800': '#014AB6',
      '900': '#013583',
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
  }

  /* @ngInject */
  function menuService(COMPONENTS, DEMOS, PAGES, $location, $rootScope) {

    var version = {};
    var sections = [];

    angular.forEach(PAGES, function (page) {
      if (page.area == 'nav') {
        sections.push({
          name: page.label,
          url: page.url,
          type: 'link'
        });
      }
    });

    var demoDocs = [];
    angular.forEach(DEMOS, function (componentDemos) {
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

    var apiDocs = {};
    COMPONENTS.forEach(function (component) {
      component.docs.forEach(function (doc) {
        if (angular.isDefined(doc.private)) return;
        apiDocs[doc.type] = apiDocs[doc.type] || [];
        apiDocs[doc.type].push(doc);
      });
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

    if (apiDocs.filter) {
      apiSections.push({
        name: 'Filters',
        pages: apiDocs.filter.sort(sortByName),
        type: 'toggle'
      });
    }

    sections.push({
      name: 'API Reference',
      type: 'heading',
      children: apiSections
    });

    function sortByName(a, b) {
      return a.name < b.name ? -1 : 1;
    }

    var self;

    $rootScope.$on('$locationChangeSuccess', onLocationChange);

    return self = {
      version: version,
      sections: sections,

      selectSection: function (section) {
        self.openedSection = section;
      },
      toggleSelectSection: function (section) {
        self.openedSection = (self.openedSection === section ? null : section);
      },
      isSectionSelected: function (section) {
        return self.openedSection === section;
      },

      selectPage: function (section, page) {
        self.currentSection = section;
        self.currentPage = page;
      },
      isPageSelected: function (page) {
        return self.currentPage === page;
      }
    };

    function onLocationChange() {
      var path = $location.path();
      var matchedPage = false;

      var matchPage = function (section, page) {
        if (path === '/' + page.url) {
          self.selectSection(section);
          self.selectPage(section, page);
          matchedPage = true;
        }
      };

      sections.forEach(function (section) {
        if (section.children) {
          // matches nested section toggles, such as API or Customization
          section.children.forEach(function (childSection) {
            if (childSection.pages) {
              childSection.pages.forEach(function (page) {
                matchPage(childSection, page);
              });
            }
          });
        }
        else if (section.pages) {
          // matches top-level section toggles, such as Demos
          section.pages.forEach(function (page) {
            matchPage(section, page);
          });
        }
        else if (section.type === 'link') {
          // matches top-level links, such as "Getting Started"
          matchPage(section, section);
        }
      });

      if (!matchedPage) {
        PAGES.forEach(function (page) {
          matchPage(page, page);
        });
      }
    }
  }

  /* @ngInject */
  function menuLinkDirective() {
    return {
      scope: {
        section: '='
      },
      templateUrl: 'partials/menu-link.html',
      link: function ($scope, $element) {
        var controller = $element.parent().controller();

        $scope.isSelected = function () {
          return controller.isSelected($scope.section);
        };
      }
    };
  }

  /* @ngInject */
  function menuToggleDirective($timeout) {
    return {
      scope: {
        section: '='
      },
      templateUrl: 'partials/menu-toggle.html',
      link: function ($scope, $element) {
        var controller = $element.parent().controller();

        $scope.isOpen = function () {
          return controller.isOpen($scope.section);
        };
        $scope.toggle = function () {
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
              $ul.css({height: targetHeight + 'px'});
            }, 0, false);

            function getTargetHeight() {
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
        if (parentNode.classList.contains('parent-list-item')) {
          var heading = parentNode.querySelector('h2');
          $element[0].firstChild.setAttribute('aria-describedby', heading.id);
        }
      }
    };
  }

  /* @ngInject */
  function DocsCtrl($scope, COMPONENTS, CONFIG, $mdSidenav, $timeout, menu, $location, $rootScope, $window) {
    $scope.COMPONENTS = COMPONENTS;
    $scope.CONFIG = CONFIG;
    $scope.menu = menu;

    $scope.path = path;
    $scope.openMenu = openMenu;
    $scope.closeMenu = closeMenu;
    $scope.isSectionSelected = isSectionSelected;

    $rootScope.$on('$locationChangeSuccess', openPage);

    //-- Define a fake model for the related page selector
    Object.defineProperty($rootScope, "relatedPage", {
      get: function () {
        return null;
      },
      set: angular.noop,
      enumerable: true,
      configurable: true
    });
    $rootScope.redirectToUrl = function (url) {
      $location.path(url);
      $timeout(function () {
        $rootScope.relatedPage = null;
      }, 100);
    };

    // Methods used by menuLink and menuToggle directives
    this.isOpen = isOpen;
    this.isSelected = isSelected;
    this.toggleOpen = toggleOpen;

    // *********************
    // Internal methods
    // *********************

    function closeMenu() {
      $timeout(function () {
        $mdSidenav('left').close();
      });
    }

    function openMenu() {
      $timeout(function () {
        $mdSidenav('left').open();
      });
    }

    function path() {
      return $location.path();
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
      if (openedSection === section) {
        selected = true;
      }
      else if (section.children) {
        section.children.forEach(function (childSection) {
          if (childSection === openedSection) {
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
  }

  /* @ngInject */
  function GuideCtrl($rootScope) {
    $rootScope.currentComponent = $rootScope.currentDoc = null;
  }

  /* @ngInject */
  function ComponentDocCtrl(doc, component, $rootScope) {
    $rootScope.currentComponent = component;
    $rootScope.currentDoc = doc;
  }

  /* @ngInject */
  function DemoCtrl($rootScope, $scope, component, demos, $http, $templateCache) {
    $rootScope.currentComponent = component;
    $rootScope.currentDoc = null;

    $scope.demos = [];

    angular.forEach(demos, function (demo) {
      // Get displayed contents (un-minified)
      var files = [demo.index]
        .concat(demo.js || [])
        .concat(demo.css || [])
        .concat(demo.html || []);
      files.forEach(function (file) {
        file.httpPromise = $http.get(file.outputPath, {cache: $templateCache})
          .then(function (response) {
            file.contents = response.data
              .replace('<head/>', '');
            return file.contents;
          });
      });
      demo.$files = files;
      $scope.demos.push(demo);
    });

    $scope.demos = $scope.demos.sort(function (a, b) {
      return a.name > b.name ? 1 : -1;
    });

  }

  /* @ngInject */
  function nospaceFilter() {
    return function (value) {
      return (!value) ? '' : value.replace(/ /g, '');
    };
  }

  /* @ngInject */
  function humanizeDocFilter() {
    return function (doc) {
      if (!doc) return;
      if (doc.type === 'directive') {
        return doc.name.replace(/([A-Z])/g, function ($1) {
          return '-' + $1.toLowerCase();
        });
      }
      return doc.label || doc.name;
    };
  }

  /* @ngInject */
  function directiveBracketsFilter() {
    return function (str) {
      if (str.indexOf('-') > -1) {
        return '<' + str + '>';
      }
      return str;
    };
  }

})();
