module.controller('chatWindowController',
    ['$routeParams', '$timeout', '$location', '$anchorScroll', '$mdSidenav', '$log', 'messageFactory', '$mdToast', '$scope',
        function($routeParams, $timeout, $location, $anchorScroll, $mdSidenav, $log, messageFactory, $mdToast, $scope) {
            let vm = this;
            vm.chatRoom = $routeParams.chatId;
            vm.pendingMessages = 0;
            vm.loading = true;
            vm.messages = [];

            // web3 provider needs to exist in order to display any chats
            if (typeof web3 !== 'undefined') {
                vm.username = web3.eth.accounts[0];

                let getMessagePromise = messageFactory.getMessagesForRoom(vm.chatRoom);

                getMessagePromise.then(function (result) {
                    vm.messages.push(...result);
                    vm.loading = false;
                }, function (err) {
                    console.log('Failed');
                    console.log(err);
                });

                $scope.$on('newMessage', (event, data) => {
                    if (data.room === vm.chatRoom) vm.messages.push(data);
                });

                vm.setMessagesForRoom = (roomName, messages) => vm.messages[roomName] = messages;

                // Generates a send message transaction on Ethereum blockchain and keeps track of payment status
                vm.send = function () {
                    if (vm.chatMessage) {
                        vm.pendingMessages++;

                        let sendMessagePromise = messageFactory.sendMessage(vm.chatRoom, vm.chatMessage);

                        sendMessagePromise.then(function (result) {
                            vm.pendingMessages--;
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('Message successfully sent, please wait for it to be included in the blockchain')
                                    .position("top right")
                                    .hideDelay(3000));
                        }, function (err) {
                            vm.pendingMessages--;
                            let errorMessage = "";
                            if (err.message.includes("MetaMask Tx Signature: User denied transaction signature.")) {
                                errorMessage = "You have rejected the message transaction";
                            } else {
                                errorMessage = "An error occurred while trying to send your message";
                            }
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(errorMessage)
                                    .position("top right")
                                    .hideDelay(3000));
                        });

                        vm.chatMessage = "";
                    } else {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Please write a message first')
                                .position("top right")
                                .hideDelay(1000));
                    }
                };

                vm.sendMessage = function (keyEvent) {
                    if (keyEvent.which === 13) vm.send();
                };

                vm.openSidenav = () => $mdSidenav('left').toggle();
            } else {
                vm.loading = false;
                vm.noWeb3 = true;
            }
        }]);