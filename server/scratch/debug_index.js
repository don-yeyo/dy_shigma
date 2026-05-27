const app = require('../index');
console.log("Successfully required index.js");

// Set a long timeout to keep event loop alive and inspect handles
setTimeout(() => {
  console.log("Checking active handles after 2 seconds...");
  const activeHandles = process._getActiveHandles();
  console.log(`Active handles count: ${activeHandles.length}`);
  activeHandles.forEach((handle, i) => {
    console.log(`Handle ${i}: type=${handle.constructor.name}`);
  });
}, 2000);
