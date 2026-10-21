require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,

  thresholds: {
    responseTimeMs: {
      medium: 2000,
      high: 4000,
    },
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "",
  },
};

module.exports = config;
