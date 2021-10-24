const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let currentUser;
const users = [];

const mongoURI = process.env.MongoURI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection
  .once("open", () => console.log("MongoDB Connection Successful"))
  .on("error", error => console.warn("Warning", error));

const Message = mongoose.model(
  "Message",
  new mongoose.Schema({
    username: {
      type: String,
      required: true
    },
    time: {
      type: Date,
      default: Date.now
    },
    body: {
      type: String,
      required: true
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.get("/chat", (req, res) => {
  if (typeof currentUser === "undefined") {
    res.redirect("/");
  } else {
    res.sendFile(`${__dirname}/public/chat.html`);
  }
});

app.post("/enter", (req, res) => {
  currentUser = req.body.username;
  res.redirect("/chat");
});

let chat = io.of("/chat").on("connection", socket => {
  const room = "ADMG Lounge";

  socket.on("join", data => {
    if (typeof currentUser !== "undefined") {
      socket.join(room);
      
      const user = { id: socket.id, username: currentUser };
      currentUser = undefined;
      users.push(user);

      Message.find({}).then(messages => {
        messages.forEach(message => socket.emit("send", message));

        socket.emit("send", {
          body: "Welcome to the ADMG Lounge Chatroom.",
          username: "Mr. Roboto",
          time: Date.now()
        });
      });

      socket.broadcast.to(room).emit("send", {
        body: `${user.username} has joined the room.`,
        username: "Mr. Roboto",
        time: Date.now()
      });

      chat.to(room).emit("update", { users });
    } else {
      socket.emit("redirect", {});
    }
  });

  socket.on("message", data => {
    data.username = users.find(user => user.id === socket.id).username;
    data.time = Date.now();

    const message = new Message(data);

    message
      .save()
      .then(() => console.log("Message saved to database."))
      .catch(err => console.error(err));

    chat.to(room).emit("send", data);
  });

  socket.on("disconnect", () => {
    const index = users.findIndex(user => user.id === socket.id);

    let user;
    if (index !== -1) {
      user = users.splice(index, 1)[0];
    }

    if (typeof user != "undefined") {
      chat.to(room).emit("send", {
        body: `${user.username} has left the room.`,
        username: "Mr. Roboto",
        time: Date.now()
      });

      chat.to(room).emit("update", { users });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
