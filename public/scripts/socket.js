const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io('https://online-chatting-demo.herokuapp.com/443');

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            socket.emit("get users");
            console.log('Connected to server successfully');

            // Get the chatroom messages
            socket.emit("get messages");
        });

        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);
            OnlineUsersPanel.update(onlineUsers);
        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            OnlineUsersPanel.addUser(user);
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);
            
            // Remove the online user
            OnlineUsersPanel.removeUser(user);
        });

        // Set up the messages event
        socket.on("messages", (chatroom) => {
            chatroom = JSON.parse(chatroom);
            //log("history", chatroom.length)
            // Show the chatroom messages
            ChatPanel.update(chatroom);
        });

        // Set up the add message event
        socket.on("add message", (message) => {
            message = JSON.parse(message);

            // Add the message to the chatroom
            ChatPanel.addMessage(message);
        });
		
		socket.on("typing message", (user)=>{
			user = JSON.parse(user);
			ChatPanel.addTypingMessage(user);
		});
	
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        if (socket && socket.connected) {
        socket.disconnect();
        }else{
            socket = null;
        }
       
    };

    // This function sends a post message event to the server
    const postMessage = function(content) {
        if (socket && socket.connected) {
            socket.emit("post message", content);
        }
    };
	
	const typingMessage = function(user) {
        if (socket && socket.connected) {
            socket.emit("typing message", user);
        }
    };
    const refreshUser = function () {
        if (socket && socket.connected) {
            socket.emit("get users");
        }
    };
    return { getSocket, connect, disconnect, postMessage, typingMessage, refreshUser };
})();
