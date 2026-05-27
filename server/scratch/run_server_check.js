console.log("Importing index.js...");
const app = require('../index');
console.log("Imported index.js. Waiting 5 seconds to see if it remains active...");

setInterval(() => {
  console.log("Server check tick - still active. Port is:", process.env.PORT || 5000);
}, 1000);
