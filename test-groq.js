const { callGroq } = require("./src/services/groqClient");

async function main() {
  try {
    const prompt =
      "AppointmentAPI failed with status 500 and returned 0 records. Write a short, human-readable alert message (1-2 sentences) for a monitoring dashboard, explaining the likely cause.";

    console.log("Calling Groq...");
    const result = await callGroq(prompt);
    console.log("\n--- Groq response ---");
    console.log(result);
  } catch (err) {
    console.error("\n--- Groq call failed ---");
    console.error(err.message);
  }
}

main();