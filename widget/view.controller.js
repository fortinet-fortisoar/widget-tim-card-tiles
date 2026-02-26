/* Copyright start
    MIT License
    Copyright (c) 2026 Fortinet Inc
Copyright end */

'use strict';

(function () {

  angular
    .module('cybersponse')
    .controller('timCardTiles100Ctrl', timCardTiles100Ctrl);

  var imageCache = {};

  timCardTiles100Ctrl.$inject = [
    '$scope',
    'widgetUtilityService',
    'config',
    'currentPermissionsService',
    'PagedCollection',
    'appModulesService',
    '$window',
    '$state',
    '$filter',
    '_',
    '$rootScope',
    'Query',
    'ModalService',
    '$resource',
    'toaster',
    '$http',
    '$sce'
  ];


  function timCardTiles100Ctrl(
    $scope,
    widgetUtilityService,
    config,
    currentPermissionsService,
    PagedCollection,
    appModulesService,
    $window,
    $state,
    $filter,
    _,
    $rootScope,
    Query,
    ModalService,
    $resource,
    toaster,
    $http,
    $sce
  ) {

    /* ============================
       Scope bindings
    ============================= */

    $scope.getList = getList;
    $scope.openRecord = openRecord;
    $scope.deleteCard = deleteCard;

    $scope.config = angular.copy(config);

    $scope.trustSrc = function(src) {
        if (!src) return '';
        return $sce.trustAsResourceUrl(src);
    };

    $scope.collapsed =
      angular.isDefined(config.widgetAlwaysExpanded) &&
      config.widgetAlwaysExpanded
        ? !config.widgetAlwaysExpanded
        : $scope.page !== undefined &&
          $scope.page.toLowerCase() !== "dashboard" &&
          $scope.page.toLowerCase() !== "reporting";

    //----------------------------------------------------------------------
    // Source code used to parse and clean-up the Summary Rich Text Markdown
    //----------------------------------------------------------------------
    $scope.extractParagraphs = function (html) {
      if (!html) return '';
      try {
        // Create a temporary DOM. 
        // Basically it creates a fakse invisible webpage and puts the HTML inside.
        // Now, the "div" object contains a webpage in memory.
        var div = document.createElement('div');
        div.innerHTML = html;
        // Get all the <p> tags from the "div" webpage.
        var paragraphs = div.getElementsByTagName('p');
        var result = []; // store all paragraphs in an array
        for (var i = 0; i < paragraphs.length; i++) {
          // Remove the HTML and extract the text between <p>
          var text = paragraphs[i].innerText || paragraphs[i].textContent;
          // Remove any empty paragraphs
          if (text && text.trim().length > 0) {
            result.push(text.trim()); // Clear any white space
          }
        }
        // Join with line breaks, <br>
        return $sce.trustAsHtml(result.join('<br><br>'));
      } catch (e) {
        console.error('HTML parse error:', e);
        return '';
      }
    };

    //----------------------------------------------------------------------
    // Source code used to display a default image in case the view.html
    // subtitle3 field is empty. Basically, just display a random image.
    // The image pool is from a specific web address:
    //   "https://filestore.fortinet.com/fortiguard/static/images/random/"
    //----------------------------------------------------------------------
    $scope.enrichThreatIntelImages = function () {
      // Check if there are any cards loaded
      if (!$scope.fieldRows || !$scope.fieldRows.length) {
        return;
      }
      // Get the field name associated with "subtitle3"
      var subtitleKey = $scope.config.mapping.subtitle3;
      if (!subtitleKey) {
        return;
      }
      // Loop the cards
      angular.forEach($scope.fieldRows, function (record) {
        // Just check for the "subtitle3" field
        if (!record[subtitleKey]) {
          return;
        }
        // If subtitle3 is empty → inject image
        // Use the "getRandomThreatImage" function
        if (
          !record[subtitleKey].value ||
          record[subtitleKey].value === ""
        ) {
          record[subtitleKey].value =
            $scope.getRandomThreatImage();
        }
      });
    };
    //----------------------------------------------------------------------
    // Source code used to enrich the display of Threat Intel Reports image
    //----------------------------------------------------------------------
    $scope.getRandomThreatImage = function () {
        var min = 1;
        var max = 54;
        var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        return "https://filestore.fortinet.com/fortiguard/static/images/random/" +
              randomNum +
              ".jpg";
  };


    /* ============================
       Init
    ============================= */

    function init() {

      $scope.modulePermissions =
        currentPermissionsService.getPermission($scope.config.module);

      if (!$scope.modulePermissions.read) {
        $scope.unauthorized = true;
        return;
      }

      _setCardColors();
      getList();
    }


    /* ============================
       Data Loader
    ============================= */
    function getList() {

      $scope.processing = true;

      var pagedCollection = new PagedCollection(
        $scope.config.module,
        null,
        {
          $limit: $scope.config.query.limit
        }
      );

      // Ensure articleimage field is included in the query
      $scope.config.query.__selectFields = _.values(
        _.omit(
          angular.copy($scope.config.mapping),
          ['showIcon', 'cardIcon']
        )
      );

      // Add articleimage to selected fields if not already present
      if ($scope.config.query.__selectFields.indexOf('articleimage') === -1) {
        $scope.config.query.__selectFields.push('articleimage');
      }

      // Also include newsURL if needed for fallback
      if ($scope.config.query.__selectFields.indexOf('newsURL') === -1) {
        $scope.config.query.__selectFields.push('newsURL');
      }

      pagedCollection.query = new Query($scope.config.query);

      pagedCollection
        .loadGridRecord()
        // OLD CODE
        // .then(function () {
        //   $scope.fieldRows = pagedCollection.fieldRows || [];
        //   $scope.processing = false;
        // })
        // NEW CODE
        .then(function () {
          $scope.fieldRows = pagedCollection.fieldRows || [];
          // Inject random images into empty motivation field
          $scope.enrichThreatIntelImages();
          $scope.processing = false;
        })

    }


    /* ============================
       Navigation
    ============================= */

    function openRecord(module, id) {

      var state = appModulesService.getState(module);

      var params = {
        module: module,
        id: $filter("getEndPathName")(id),
        previousState: $state.current.name,
        previousParams: JSON.stringify($state.params)
      };

      $state.go(state, params);
    }


    /* ============================
       Delete
    ============================= */

    function deleteCard(event, cardId) {

      event.stopPropagation();
      event.preventDefault();

      ModalService
        .confirm('Are you sure that you want to delete selected card?')

        .then(function (result) {

          if (!result) return;


          $resource(cardId)
            .delete()
            .$promise

            .then(function () {

              $scope.fieldRows = _.reject(
                $scope.fieldRows,
                function (item) {
                  return item['@id'].value === cardId;
                }
              );

              toaster.success({
                body: 'Card deleted successfully'
              });

            }, function () {

              toaster.error({
                body: 'Unable to delete card'
              });

            });
        });
    }


    /* ============================
       Theme
    ============================= */

    function _setCardColors() {

      var theme = $rootScope.theme;

      $scope.cardTilesThemeColor = {};

      if (theme.id === "light") {

        $scope.cardTilesThemeColor = {
          cardBackgroundColor: "#eeeeee",
          cardBorderLeftColor: "#eeeeee",
          cardIconSeparator: "#eeeeee"
        };

      } else if (theme.id === "steel") {

        $scope.cardTilesThemeColor = {
          cardBackgroundColor: "#29323e",
          cardBorderLeftColor: "#29323e",
          cardIconSeparator: "#29323e"
        };

      } else {

        $scope.cardTilesThemeColor = {
          cardBackgroundColor: "#262626",
          cardBorderLeftColor: "#262626",
          cardIconSeparator: "#29323e"
        };
      }
    }


    /* ============================
       Image Fetcher (Fixed)
    ============================= */

    function fetchArticleImage(url) {

      if (imageCache[url]) {
        return Promise.resolve(imageCache[url]);
      }


      return $http.post('/api/3/integration/execute', {
        connector: 'http',
        operation: 'request',
        params: {
          method: 'GET',
          url: url,
          timeout: 10
        }
      })

      .then(function (resp) {

        var html = resp.data.response || '';


        var og = html.match(/<meta property="og:image" content="(.*?)"/i);

        if (og && og[1]) {
          imageCache[url] = og[1];
          return og[1];
        }


        var twitter = html.match(/<meta name="twitter:image" content="(.*?)"/i);

        if (twitter && twitter[1]) {
          imageCache[url] = twitter[1];
          return twitter[1];
        }


        return null;
      })

      .catch(function () {
        return null;
      });
    }

    /* ============================
       Start
    ============================= */
    init();

  }

})();
