(function() {
    'use strict';
    // Get the app
    var app = angular.module('cfdeck');


    app.directive('serviceDestroyer', function($cloudfoundry, $route) {
        return {
            templateUrl: 'app/views/partials/service_destroyer.html',
            controller: function($scope) {
                $scope.view = {
                    status: 'unconfirmed',
                    disableButton: false,
                };
                $scope.view.showDestroyer = function(state) {
                    $scope.view.status = state;
                };
                $scope.view.deleteService = function(service, bound) {
                    $scope.view.disableButton = true;
                    $cloudfoundry.deleteServiceInstance(service, bound)
                        .then(function(response) {
                            if (response.code === undefined) {
                                $scope.view.status = "success";
                                $route.reload();
                            } else if (response.code === 10006) {
                                $scope.view.status = "boundError";
                            } else {
                                $scope.view.status = "error";
                            }
                             $scope.view.disableButton = false;
                        });
                };
            }
        };
    });
    app.directive('deckHeader', function($cloudfoundry, $uaa) {
        return {
            templateUrl: 'app/views/partials/header.html',
            controller: function($scope) {
              // Render the orgs on the page
              var renderOrgs = function(orgs) {
                  $scope.orgs = orgs;
                  $cloudfoundry.setOrgsData(orgs);
              };
              var renderName = function(name) {
                  $scope.givenName = name;
              };
              // Get the auth status
              $cloudfoundry.getAuthStatus().then(function (status) {
                if (status === "authorized") {
                  $scope.authorized = true;
                  // Load the org data
                  $cloudfoundry.getOrgsData(renderOrgs);
                  // Load username
                  $uaa.getUserInfoGivenName().then(renderName);
                }
                else {
                  $scope.authorized = false;
                }
              });
            }
        };
    });
}());
