require("dotenv").config()
const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
// Create the Express app
const app = express();
const {createServer} = require("http");
const {Server} = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);
const mongoose = require("mongoose")
//midware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Use the json middleware to parse JSON data
app.use(express.json());
const Message = require("./models/Message")
const ChatUser = require("./models/ChatUser")
const MongoStore = require("connect-mongo");
mongoose.connect(process.env.DATABASE_URL, () => {
	console.log("connected to db succesffuly")
})
// Use the session middleware to maintain sessions
const chatSession = session({
	secret: process.env.EXPRESS_SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	rolling: true,
	//10 min = 10*60*100ms
	cookie: { maxAge: 60000 },
	//set one hour cookie
	store: MongoStore.create({
		client: mongoose.connection.getClient(),
		dbName: process.env.MONGO_DB_NAME,
		collectionName: "sessions",
		stringify: false,
		autoRemove: "interval",
		autoRemoveInterval: 1
	})
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", async (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;
	if(!username || !avatar || !name || !password){
		res.json({ status: "error", error: "Username, avatar, name or password is empty"});
		return
	}
	else if(!containWordCharsOnly(username)){
		res.json({ status: "error", error: "Username can contains word chars only"});
		return
	}else{
		const user = await ChatUser.findOne({ name: name });
		if (user !== null) {
			res.json({ status: "error", error: "Name already exists." });
			return
		} else {
			const hash = bcrypt.hashSync(password, 10);
			const newUser = await ChatUser.create({
				username:username,
				name: name,
				password: hash,
				avatar: avatar,
			})
			await newUser.save()
			res.json({ status: "success" });
			return
		}
	}

});

// Handle the /signin endpoint
app.post("/signin", async (req, res) => {
    const { username, password } = req.body;
	const user = await ChatUser.findOne({ username: username });
	if(user !== null){
		
		const hashedPassword = user['password'];
		if (!bcrypt.compareSync(password, hashedPassword)) {
			res.json({ status: "error", error: "Username or Password is not correct" });
			return;
		};
		// G. Sending a success response with the user account
		const avatar = user['avatar'];
		const name = user['name'];
		req.session.user = { username, avatar, name };
		res.json({ status: "success", user: { username, avatar, name } });
		return;
	}else{
		res.json({ status: "error", error: "Username or Password is not correct" });
		return
	}
	


});

// Handle the /validate endpoint
app.get("/validate", (req, res ) => {
	if(req.session.user){
		const user = req.session.user;
		const avatar = user['avatar'];
		const name = user['name'];
		res.json({status: "success", user : {user, avatar, name}})
	}else{
		res.json({status: "error", error: "No session is established."})
	}
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {
	delete req.session.user;
	req.session=null
	res.json({status: "success"});
});




io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

const onlineUsers = {};
const typingUsers = {};

io.on("connection", (socket) => {
	
	// Add a new user to the online user list	
	if(socket.request.session.user){
		const {username, avatar, name} = socket.request.session.user;
		onlineUsers[username] = {avatar: avatar, name: name };
		io.emit("add user", JSON.stringify(socket.request.session.user));	
	};

	socket.on("disconnect", () => {
		// Remove the user from the online user list
		if(socket.request.session.user){
			const {username} = socket.request.session.user;
			if(onlineUsers[username]) delete onlineUsers[username];	
			io.emit("remove user", JSON.stringify(socket.request.session.user));
		}
	});
	
	socket.on("get users", () => {
		// Get the online user list
		socket.emit("users", JSON.stringify(onlineUsers));
	});


	socket.on("get messages", async () => {
		const allMessages = await Message.find({});
		socket.emit("messages", JSON.stringify(allMessages));

	});
	
	socket.on("post message",async (content) => {
		// Add the message to the chatroom
		const datetime = new Date();
		
		if(socket.request.session.user){
			const {username, avatar, name} = socket.request.session.user;
			const message = await Message.create({
				user: { username, avatar, name },
				content: content,
				datetime: datetime,
			})
			await message.save()
			const res = {
				user: { username, avatar, name },
				datetime: datetime,
				content: content,
			}
			io.emit("add message", JSON.stringify(res));
			
		}
	});
	
				
	socket.on("typing message", (user) => {
		if(socket.request.session.user){
			const {username, avatar, name} = socket.request.session.user;
			typingUsers[username] = {avatar: avatar, name: name };

			io.emit("typing message", JSON.stringify(typingUsers[username]));
		}
		
	});

});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
	console.log("The chat server has started...");
});