module.controller('sidenavController',
    ['$scope', '$timeout', '$mdSidenav', '$log', '$mdDialog', '$location', '$cookies', '$routeParams', 'messageFactory', '$mdToast',
        function ($scope, $timeout, $mdSidenav, $log, $mdDialog, $location, $cookies, $routeParams, messageFactory, $mdToast) {
            let vm = this;

            if (typeof web3 !== 'undefined') {
                vm.username = web3.eth.accounts[0];
            }

            vm.close = () => $mdSidenav('left').close();
            vm.enterChat = (chatName) => $location.path("chat/" + chatName);

            // Load saved chats from cookies or init as new object if chat cookie is undefined
            vm.chats = $cookies.getObject('chats') || {};

            vm.findChat = function(chatName) {
                // Init new chat with an unread message count of 0
                vm.chats[chatName] = 0;
                $cookies.putObject('chats', vm.chats);

                vm.enterChat(chatName);
            };

            vm.showFindDialog = function() {
                // Create an empty find dialog
                let confirm = $mdDialog.prompt()
                    .title('Find chat')
                    .textContent('Join an existing chat or create a new one')
                    .placeholder('Chat name')
                    .ok('Find')
                    .cancel('Cancel');

                $mdDialog.show(confirm).then((result) => vm.findChat(result));
            };

            vm.showAboutDialog = function() {
                $mdDialog.show({
                    controller: function($scope, $mdDialog) {
                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        };
                    },
                    templateUrl: '/components/about/about.html',
                    clickOutsideToClose:true,
                    fullscreen: $scope.customFullscreen
                })
            };

            vm.updateUsername = function(name) {
                let updateNamePromise = messageFactory.updateUsername(name);

                updateNamePromise.then(function(result) {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Successfully sent username update request. Please wait for it to be included in the blockchain, then refresh the page')
                            .position("top right")
                            .hideDelay(4000));
                }, function(err) {
                    console.log(err);
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('There was an error trying to update your username')
                            .position("top right")
                            .hideDelay(3000));
                });
            };

            vm.showSettingsDialog = function() {
                // Create an empty settings dialog
                let confirm = $mdDialog.prompt()
                    .title('Settings')
                    .textContent('Custom username')
                    .placeholder('Username')
                    .ok('Save')
                    .cancel('Cancel');

                $mdDialog.show(confirm).then((result) => vm.updateUsername(result));
            };

            vm.removeChat = function(chatName) {
                delete vm.chats[chatName];
                $cookies.putObject('chats', vm.chats);
                vm.enterChat("mainchat");
            }
        }]);