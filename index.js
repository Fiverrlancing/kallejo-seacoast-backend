const express = require('express')
const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const FormData = require("form-data");

const app = express()
const port = 3000

// These parameters should be used for all requests
const SUMSUB_APP_TOKEN = "YOUR_SUMSUB_APP_TOKEN"; // Example: sbx:uY0CgwELmgUAEyl4hNWxLngb.0WSeQeiYny4WEqmAALEAiK2qTC96fBad - Please don't forget to change when switching to production
const SUMSUB_SECRET_KEY = "YOUR_SUMSUB_SECRET_KEY"; // Example: Hej2ch71kG2kTd1iIUDZFNsO5C1lh5Gq - Please don't forget to change when switching to production
const SUMSUB_BASE_URL = "https://api.sumsub.com";

var config = {};
config.baseURL = SUMSUB_BASE_URL;

function createSignature(config) {
  console.log("Creating a signature for the request...");

  var ts = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", SUMSUB_SECRET_KEY);
  signature.update(ts + config.method.toUpperCase() + config.url);

  if (config.data instanceof FormData) {
    signature.update(config.data.getBuffer());
  } else if (config.data) {
    signature.update(config.data);
  }

  config.headers["X-App-Access-Ts"] = ts;
  config.headers["X-App-Access-Sig"] = signature.digest("hex");

  return config;
}

// https://developers.sumsub.com/api-reference/#access-tokens-for-sdks
function createAccessToken(
  externalUserId,
  levelName = "basic-kyc-level",
  ttlInSecs = 600
) {
  console.log("Creating an access token for initializng SDK...");

  var method = "post";
  var url = `/resources/accessTokens?userId=${externalUserId}&ttlInSecs=${ttlInSecs}&levelName=${levelName}`;

  var headers = {
    Accept: "application/json",
    "X-App-Token": SUMSUB_APP_TOKEN,
  };

  config.method = method;
  config.url = url;
  config.headers = headers;
  config.data = null;

  return config;
}

axios.interceptors.request.use(createSignature, function (error) {
  return Promise.reject(error);
});

async function handleRequest(req, res) {
  const externalUserId = req.params?.['id'] || "random-JSToken-" + Math.random().toString(36).substr(2, 9);
  console.log("🚀 ~ file: index.js ~ line 67 ~ app.get ~ externalUserId", externalUserId)

  await axios(
    createAccessToken(externalUserId, "basic-kyc-level", 1200)
  )
    .then(function (result) {
      console.log("Response:\n", result.data);
      return res.json(result.data);
    })
    .catch(function (error) {
      console.log("Error:\n", error.response.data);
      return res.json(error.response.data);
    });
}

app.get('/', async (req, res) => {
  return handleRequest(req, res);
})

app.get('/:id', async (req, res) => {
  return handleRequest(req, res);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})