module.service('messageFactory', ['$cookies', '$q', '$rootScope', function ($cookies, $q, $rootScope) {
    let vm = this;

    // Store messages for chat rooms
    let chatRoomMessages = {};

    // Store object of addresses to names
    let addressesToNames = {};

     // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use the browser's ethereum provider
        web3 = new Web3(web3.currentProvider);

        web3.eth.defaultAccount = web3.eth.accounts[0];

        let EthChatContract = web3.eth.contract([
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "_roomName",
                        "type": "string"
                    },
                    {
                        "name": "_index",
                        "type": "uint256"
                    }
                ],
                "name": "getMessageByIndexForRoom",
                "outputs": [
                    {
                        "name": "",
                        "type": "string"
                    },
                    {
                        "name": "",
                        "type": "address"
                    },
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "_user",
                        "type": "address"
                    }
                ],
                "name": "getUsernameForAddress",
                "outputs": [
                    {
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "kill",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_msg",
                        "type": "string"
                    },
                    {
                        "name": "_roomName",
                        "type": "string"
                    }
                ],
                "name": "sendMessage",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_name",
                        "type": "string"
                    }
                ],
                "name": "createUser",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "_roomName",
                        "type": "string"
                    }
                ],
                "name": "getMessageCountForRoom",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "name": "message",
                        "type": "string"
                    },
                    {
                        "indexed": false,
                        "name": "user",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "name": "roomName",
                        "type": "string"
                    }
                ],
                "name": "NewMessage",
                "type": "event"
            }
        ]);
        // Ropsten test network contract address
        let EthChat = EthChatContract.at('0x68e8e7b81d450f022a231b57b014f347d7f2a34a');
        // Main network contract address
        //let EthChat = EthChatContract.at('0xB5f1E1EB84947E99b24F8690da938a8016672b66');

        let fetchMessagesForRoom = function(roomName) {
            let deferred = $q.defer();

            // Get amount of messages needed to be fetched from Ethereum, since you cannot return objects
            // or lists in Solidity each call must be seperate
            EthChat.getMessageCountForRoom(roomName, {from: web3.eth.defaultAccount}, (err, result) => {
                if (err) {
                    console.log("Error fetching message count for room " + chatRoom);
                    console.log(err);
                    deferred.reject(err);
                } else {
                    let messageCount = result.c[0];

                    if (messageCount === 0) {
                        deferred.resolve([]);
                    } else {
                        // Initialize array so that it can be asynchronously filled
                        let messages = new Array(messageCount);

                        // I could constantly check messages to see if it contains null values, but it's more efficient
                        // to track how many async operations have resolved to see if messages is populated
                        let addedMessages = 0;

                        // Fetch all messages for given room asynchronously
                        for (let i = 0; i < messageCount; i++) {
                            EthChat.getMessageByIndexForRoom(roomName, i, {from: web3.eth.defaultAccount}, function (err, result) {
                                if (err) {
                                    console.log("Error fetching message " + i + " from room " + chatRoom);
                                    console.log(err);
                                    deferred.reject(err);
                                } else {
                                    let date = new Date(0);
                                    date.setUTCSeconds(result[2].c[0]);

                                    // If user name is already stored then fetch from cache, otherwise another call
                                    // must be made to get the display name
                                    if (addressesToNames[result[1]]) {
                                        // Add new message to correct index in messages
                                        messages[i] = {
                                            username: result[1],
                                            displayname: addressesToNames[result[1]],
                                            timestamp: result[2].c[0],
                                            message: result[0],
                                            date: date
                                        };
                                        addedMessages++;
                                        if (addedMessages === messageCount) deferred.resolve(messages);
                                    } else {
                                        getNameForAddress(result[1]).then(
                                            function (name) {
                                                // Add new message to correct index in messages
                                                messages[i] = {
                                                    username: result[1],
                                                    displayname: name,
                                                    timestamp: result[2].c[0],
                                                    message: result[0],
                                                    date: date
                                                };
                                                addressesToNames[result[1]] = name;
                                                addedMessages++;
                                                if (addedMessages === messageCount) deferred.resolve(messages);
                                            }, function (nameErr) {
                                                console.log('Failed');
                                                console.log(nameErr);
                                                deferred.reject(nameErr);
                                            });
                                    }
                                }
                            });
                        }
                    }
                }
            });
            return deferred.promise;
        };

        let sendMessage = function(roomName, message) {
            let deferred = $q.defer();
            EthChat.sendMessage(message, roomName, {from: web3.eth.defaultAccount}, function (err, result) {
                if (err) {
                    console.log(err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        };

        let getNameForAddress = function(address) {
            let deferred = $q.defer();
            EthChat.getUsernameForAddress(address, {from: web3.eth.defaultAccount}, (err, result) => {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        };

        let updateUsername = function(username) {
            let deferred = $q.defer();
            EthChat.createUser(username, {from: web3.eth.defaultAccount}, (err, result) => {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        };

        let getMessagesForRoom = function(roomName) {
            let deferred = $q.defer();

            // If messages are cached then load from there, otherwise fetch from Ethereum
            if (chatRoomMessages[roomName]) {
                console.log("Loading from cache: " + JSON.stringify(chatRoomMessages[roomName]));
                deferred.resolve(chatRoomMessages[roomName]);
            } else {
                fetchMessagesForRoom(roomName).then(
                    function(result) {
                        chatRoomMessages[roomName] = result;
                        deferred.resolve(result);
                    }, function(err) {
                        console.log('Failed');
                        console.log(err);
                        deferred.reject(err);
                    });
            }
            return deferred.promise;
        };

        // Load chats from cookie
        let chatNames = $cookies.getObject('chats') || {};

        let event = EthChat.NewMessage();
        let newMessages = {};

        // Create a listener for new messages in this room, if a new message needs to be added to a room broadcast an
        // event so that it can be handled by the chatWindow controller
        event.watch(function(error, result){
            if (error) console.log("wait for a while, check for block Synchronization or block creation, " + error);
            let room = result.args.roomName;

            // It is possible for this event to fire multiple times for the same transaction, so all new event based
            // messages need to be properly tracked in order to dedupe properly
            if (!newMessages[room] || !newMessages[room].includes(result.transactionHash)) {
                if (newMessages[room]) {
                    newMessages[room].push(result.transactionHash);
                } else {
                    newMessages[room] = [result.transactionHash];
                }

                if (!chatRoomMessages[room]) chatRoomMessages[room] = [];

                let date = new Date(0);
                date.setUTCSeconds(result.args.timestamp.c[0]);

                // Fetch username for sender and generate a message object
                getNameForAddress(result.args.user).then(function (name) {
                    let message = {
                        username: result.args.user,
                        displayname: name,
                        timestamp: result.args.timestamp.c[0],
                        message: result.args.message,
                        date: date,
                        room: room
                    };
                    chatRoomMessages[room].push(message);

                    // Broadcast a new message event to the chatWindow component
                    $rootScope.$broadcast('newMessage', message);
                });
            }
        });

        return {
            getMessagesForRoom: (room) => getMessagesForRoom(room),
            sendMessage: (roomName, message) => sendMessage(roomName, message),
            updateUsername: (name) => updateUsername(name),
            getNameForAddress: (address) => getNameForAddress(address),
            addMessageToRoom: (roomName, message) => addMessageToRoom(roomName, message),
            getEthChat: () => EthChat,
        };
    }
}]);