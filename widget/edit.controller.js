/* Copyright start
    MIT License
    Copyright (c) 2026 Fortinet Inc
Copyright end */

'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editTimCardTiles100Ctrl', editTimCardTiles100Ctrl);

    editTimCardTiles100Ctrl.$inject = ['$scope', 
    '$uibModalInstance', 
    'config', 
    'widgetUtilityService', 
    '$timeout', 
    "appModulesService",
    "Entity"];

    function editTimCardTiles100Ctrl($scope, 
    $uibModalInstance, 
    config, 
    widgetUtilityService, 
    $timeout,
    appModulesService,
    Entity) 
    {
        // $scope.cancel = cancel;
        // $scope.save = save;
        // $scope.config = config;

        // function _handleTranslations() {
        //   let widgetNameVersion = widgetUtilityService.getWidgetNameVersion($scope.$resolve.widget, $scope.$resolve.widgetBasePath);
          
        //   if (widgetNameVersion) {
        //     widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
        //       $scope.viewWidgetVars = {
        //         // Create your translating static string variables here
        //       };
        //     });
        //   } else {
        //     $timeout(function() {
        //       $scope.cancel();
        //     });
        //   }
        // }

        // function init() {
        //     // To handle backward compatibility for widget
        //     _handleTranslations();
        // }

        // init();

        // function cancel() {
        //     $uibModalInstance.dismiss('cancel');
        // }

        // function save() {
        //     $uibModalInstance.close($scope.config);
        // }

      $scope.cancel = cancel;
      $scope.save = save;
      $scope.loadAttributes = loadAttributes;
      function _init(){
        var _config = {
          mapping: {
              cardHeader:null,
              cardTitle: null,
              subtitle1: null,
              subtitle2: null,
              showIcon: false,
              cardIcon: 'fa fa-none',
              cardDetails: null,
              cardLeftBorder: null
            }};
        $scope.config = {};
        angular.extend($scope.config, _config, config);
        $scope.pageConfig = {
          maxRecordSize: [5, 10, 20, 30, 40, 50, 100, 200],
        };
        appModulesService.load(true).then(function (modules) {
          $scope.modules = modules;
          if ($scope.config.module !== "") {
            loadAttributes();
          }
        });
      }
      function loadAttributes() {
        $scope.fields = [];
        $scope.fieldsArray = [];
        $scope.pickListFields = [];
        var entity = new Entity($scope.config.module);
        entity.loadFields().then(function () {
          for (var key in entity.fields) {
            if (entity.fields[key].type === "picklist") {
              $scope.pickListFields.push(entity.fields[key]);
            }
          }
          $scope.fields = entity.getFormFields();
          angular.extend($scope.fields, entity.getRelationshipFields());
          $scope.fieldsArray = entity.getFormFieldsArray();
        });
      }
      function cancel() {
        $uibModalInstance.dismiss("cancel");
      }

      function save() {
        $uibModalInstance.close($scope.config);
      }
      _init();

    }
})();
