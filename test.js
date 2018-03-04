const Storage = require("./dist/local-cache.js");

// console.log(Storage);

var storage = new Storage("./.cache", { force: true });
storage.on("storage", data => console.log(data));
// storage.on("storage", function(data) {
//   console.log(data);
// });

storage.setItem("foo", "bar");
// console.log(storage.getItem("foo"));


storage.removeItem("foo");
storage.setItem("a.b.c", "e");
console.log(storage.getItem("*"));

storage.clear();
storage.getItem("*");