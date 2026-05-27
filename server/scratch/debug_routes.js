console.log("Loading routes one by one...");

try {
  console.log("Loading finnegans routes...");
  const finnegans = require('../routes/finnegans');
  console.log("Finnegans routes loaded successfully.");
} catch(e) {
  console.error("Error loading finnegans routes:", e);
}

try {
  console.log("Loading cot routes...");
  const cot = require('../routes/cot');
  console.log("Cot routes loaded successfully.");
} catch(e) {
  console.error("Error loading cot routes:", e);
}

try {
  console.log("Loading system routes...");
  const system = require('../routes/system');
  console.log("System routes loaded successfully.");
} catch(e) {
  console.error("Error loading system routes:", e);
}

try {
  console.log("Loading shigma routes...");
  const shigma = require('../routes/shigma');
  console.log("Shigma routes loaded successfully.");
} catch(e) {
  console.error("Error loading shigma routes:", e);
}

console.log("All routes required. Starting dummy timer...");
setTimeout(() => {
  console.log("Timer fired. Event loop is healthy!");
}, 1000);
