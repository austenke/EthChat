var module = angular.module("EthChat", ['ngRoute', 'ngMaterial', 'ngCookies']);

module.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix("!");
        $locationProvider.html5Mode(false);
        $routeProvider.
        when('/chat/:chatId', {
            templateUrl: './components/chatWindow/chatWindow.html',
            controller: 'chatWindowController as vm'
        }).
        otherwise({
            redirectTo: '/chat/mainchat',
        });
    }]);

module.directive('ngScrollBottom', ['$timeout', function ($timeout) {
    return {
        scope: {
            ngScrollBottom: "="
        },
        link: function ($scope, $element) {
            $scope.$watchCollection('ngScrollBottom', function (newValue) {
                if (newValue) {
                    $timeout(function(){
                        $element.scrollTop($element[0].scrollHeight);
                    }, 0);
                }
            });
        }
    }
}]);