window.addEventListener("DOMContentLoaded", () => {
  const chatMsgs = document.querySelector(".chat-messages");
  const userList = document.querySelector("#users");
  const msgTArea = document.querySelector("#msg");
  const chatForm = document.forms["chat-form"];

  var socket = io("https://admg-c.glitch.me/chat");
  
  const sendMsg = event => {
    event.preventDefault();
    msgTArea.focus();

    if (msgTArea.value.trim().length === 0) {
      msgTArea.value = "";
      if (chatForm.checkValidity() === false) {
        chatForm.elements["send-msg"].click();
        return;
      }
    }
    
    socket.emit("message", { body: msgTArea.value });
    msgTArea.value = "";
  };

  window.onresize = () => (chatMsgs.scrollTop = chatMsgs.scrollHeight);
  
  window.onkeydown = event => {
    if (event.keyCode == 13 && event.shiftKey === false) {
      sendMsg(event);
    }
  };

  chatForm.onsubmit = event => sendMsg(event);

  msgTArea.focus();
  
  socket.emit("join", {});

  socket.on("redirect", () => {
    window.location.replace("/index.html");
  });

  socket.on("send", data => {
    if (
      data.body === "Welcome to the ADMG Lounge Chatroom." &&
      chatMsgs.children.length > 0
    ) {
      const hrule = document.createElement("hr");
      hrule.classList.add("mb-1");

      const subscript = document.createElement("sub");
      subscript.classList.add("mt-0", "pt-0", "text-black-50");
      subscript.innerText = "Previous Messages";

      chatMsgs.appendChild(subscript);
      chatMsgs.appendChild(hrule);
    }

    const msgCard = document.createElement("div");
    msgCard.classList.add("card", "my-4", "px-4", "pt-3", "pb-1", "shadow-sm");

    const meta = document.createElement("p");
    meta.classList.add("meta", "text-secondary");

    const time = document.createElement("span");
    time.classList.add("timestamp");

    const content = document.createElement("p");
    content.classList.add("body");

    content.innerText = data.body;
    meta.innerHTML = `<strong>${data.username}</strong> `;
    time.innerText = new Date(data.time).toLocaleString();

    meta.appendChild(time);
    msgCard.appendChild(meta);
    msgCard.appendChild(content);

    chatMsgs.appendChild(msgCard);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  });

  socket.on("update", ({ users }) => {
    userList.innerHTML = "";
    users.forEach(user => {
      const li = document.createElement("li");
      li.innerText = user.username;
      userList.appendChild(li);
    });
  });
});
