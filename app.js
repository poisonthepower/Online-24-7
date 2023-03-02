const Eris = require("eris");
const keepAlive = require("./server");
keepAlive();

const bot = new Eris(process.env.TOKEN);

bot.on("ready", () => {
  console.log("Bot is online!");

  // Set status
  bot.editStatus("online", {
    name: "Don't dm me",
    type: 1,
  });
});

bot.connect();
