const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const axios = require("axios");

const app = express();
const cors = require("cors");
var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
var myWs;

app.get("/", function (req, res) {
  res.status(200).send("Hello World!");
});

app.post("/hooks/payment_success", function (req, res) {
  console.log("Payment success");
  if (myWs) {
    myWs.send("Payment success");
  }
  res.status(200).json({
    status: 200,
    body: { message: "ok" },
  });
});

app.post("/hooks/payment_failure", function (req, res) {
  console.log("Payment failure");
  if (myWs) {
    myWs.send("Payment failure");
  }
  
  console.log("vivaPaymentWebhook body",req.body);
  res.status(200).json({
    status: 200,
    body: { message: "ok" },
  });
});

app.get("/hooks/payment_success", async function (req, res) {
    const merchantId = "af54a436-1e4c-440c-8ed6-76b3646b174f"; // Production merchant ID
  const apiKey = "1U7D3K05W2n8jcSi947f14P88rd58T"; // Production API key
  
  const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');
  const resp = await axios.get("https://www.vivapayments.com/api/messages/config/token", {
    headers: { 'Authorization': `Basic ${credentials}` }
  });
  let verificationKey = resp.data.Key;
  res.status(200).json({
    //first is dev key, second is prod key
    // key: "F346EB518238430EAA4615ACAA93CCAE42BCE2B0",
    key: verificationKey,
  });
});

app.get("/hooks/payment_failure", async function (req, res) {
    const merchantId = "af54a436-1e4c-440c-8ed6-76b3646b174f"; // Production merchant ID
  const apiKey = "1U7D3K05W2n8jcSi947f14P88rd58T"; // Production API key
  
  const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');
  const resp = await axios.get("https://www.vivapayments.com/api/messages/config/token", {
    headers: { 'Authorization': `Basic ${credentials}` }
  });
  let verificationKey = resp.data.Key;
  res.status(200).json({
    //first is dev key, second is prod key
    // key: "F346EB518238430EAA4615ACAA93CCAE42BCE2B0",
    key: verificationKey,
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(process.env.port || 1337, function () {
  console.log("Server running");
});

wss.on("connection", function (ws) {
  console.log("new connection");
  myWs = ws;
});
