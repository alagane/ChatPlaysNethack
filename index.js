require("./config");

var Telnet = require("telnet-client");
var connection = new Telnet();

const Eris = require("eris");
var bot = new Eris(BOT_TOKEN);

var params = {
  host: "nethack.alt.org",
  port: 23,
  negotiationMandatory: false,
  timeout: 0,
  ors: ""
};

connection.on("ready", function() {
  connection.addListener("data", promptLogin);
  connection.send("l");
});

function promptLogin(buffer) {
  stringBuffer = buffer.toString("utf8");
  if (stringBuffer.includes("Please enter your username.")) {
    connection.removeListener("data", promptLogin);
    connection.addListener("data", promptPassword);
    connection.send(NAO_LOGIN + "\r");
  }
}

function promptPassword(buffer) {
  stringBuffer = buffer.toString("utf8");
  if (stringBuffer.includes("Please enter your password.")) {
    connection.removeListener("data", promptPassword);
    connection.addListener("data", mainMenu);
    connection.send(NAO_PASSWORD + "\r");
  }
}

function mainMenu(buffer) {
  stringBuffer = buffer.toString("utf8");
  if (stringBuffer.includes("Logged in as:")) {
    connection.removeListener("data", mainMenu);
    connection.addListener("data", newGameOrContinue);
    connection.send("pp");
  }
}

function newGameOrContinue(buffer) {
  stringBuffer = buffer.toString("utf8");
  if (
    stringBuffer.includes(
      "Shall I pick character's race, role, gender and alignment for you?"
    )
  ) {
    connection.removeListener("data", newGameOrContinue);
    connection.send("yy");
  } else if (stringBuffer.includes("Restoring save file...")) {
    connection.removeListener("data", newGameOrContinue);
    connection.send(" ");
  }
}

connection.on("data", function(buffer) {
  console.log(buffer.toString("utf8"));
});

connection.connect(params);

let nethackChannelId;
let welcomeMessageId;
let welcomeMessage =
  "Special characters are sp (space), rt (return), es (escape) and bs (backspace).";

bot.on("messageCreate", msg => {
  if (!msg.author.bot) {
    if (msg.content === "!nethackhere") {
      nethackChannelId = msg.channel.id;
      bot
        .createMessage(nethackChannelId, welcomeMessage)
        .then(message => (welcomeMessageId = message.id));
    } else if (msg.channel.id === nethackChannelId) {
      let key = messageToKey(msg.content);
      if (key !== undefined) {
        connection.send(key);
        bot.editMessage(
          nethackChannelId,
          welcomeMessageId,
          welcomeMessage + " Latest input: " + msg.content + "."
        );
      }
    }
  }
});

bot.connect();

function messageToKey(message) {
  switch (message) {
    case "sp":
      return " ";
    case "rt":
      return "\r";
    case "es":
      return String.fromCharCode(27);
    case "bs":
      return String.fromCharCode(8);
  }

  if (message.match(/^[!-~]$/g)) {
    return message;
  }
}
