const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

let myWs;
let paymentStatus = null; // 🔹 store latest payment status

// Root route
app.get("/", function (req, res) {
  res.status(200).send("Hello World!");
});

// ----------------- OLD HOOKS -----------------

// app.post("/hooks/payment_success", function (req, res) {
//   console.log("Payment success (old)");
//   if (myWs) {
//     myWs.send("Payment success");
//   }
//   res.status(200).json({
//     status: 200,
//     body: { message: "ok" },
//   });
// });

// app.post("/hooks/payment_failure", function (req, res) {
//   console.log("Payment failure (old)");
//   if (myWs) {
//     myWs.send("Payment failure");
//   }
//   console.log("vivaPaymentWebhook body", req.body);
//   res.status(200).json({
//     status: 200,
//     body: { message: "ok" },
//   });
// });

// ----------------- NEW HOOKS -----------------

// Webhooks (called by payment portal)
app.post("/hooks/payment_success", (req, res) => {
  console.log("Payment success (new)");

  paymentStatus = {
    status: "success",
    code: 200,
    message: "Payment successful",
  };

  if (myWs) {
    myWs.send("Payment success",paymentStatus); // 🔥 notify frontend via socket
  }

  res.status(200).json({ message: "Webhook received" });
});

app.post("/hooks/payment_failure", (req, res) => {
  console.log("Payment failure (new)");

  paymentStatus = {
    status: "fail",
    code: 400,
    message: "Payment failed",
  };

  if (myWs) {
    myWs.send("Payment failure",paymentStatus); // 🔥 notify frontend via socket
  }

  res.status(200).json({ message: "Webhook received" });
});

// ----------------- COMMON TOKEN ENDPOINTS -----------------

app.get("/hooks/payment_success", async function (req, res) {
  const merchantId = "af54a436-1e4c-440c-8ed6-76b3646b174f"; // Production merchant ID
  const apiKey = "1U7D3K05W2n8jcSi947f14P88rd58T"; // Production API key

  const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
  const resp = await axios.get(
    "https://www.vivapayments.com/api/messages/config/token",
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );
  let verificationKey = resp.data.Key;
  res.status(200).json({
    key: verificationKey,
  });
});

app.get("/hooks/payment_failure", async function (req, res) {
  const merchantId = "af54a436-1e4c-440c-8ed6-76b3646b174f"; // Production merchant ID
  const apiKey = "1U7D3K05W2n8jcSi947f14P88rd58T"; // Production API key

  const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString("base64");
  const resp = await axios.get(
    "https://www.vivapayments.com/api/messages/config/token",
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );
  let verificationKey = resp.data.Key;
  res.status(200).json({
    key: verificationKey,
  });
});

// ----------------- NEW STATUS ENDPOINT -----------------

// New API for frontend (without socket)
app.get("/response/status", (req, res) => {
  if (!paymentStatus) {
    return res.status(404).json({
      status: "pending",
      code: 102,
      message: "Payment not received yet",
    });
  }

  const statusToSend = { ...paymentStatus };

  // 🔹 Reset immediately after sending, so next poll = pending
  paymentStatus = null;

  return res.status(statusToSend.code).json(statusToSend);
});

// ----------------- SERVER & SOCKET -----------------

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("new connection");
  myWs = ws;

  // optional: send current status on connect
  if (paymentStatus) {
    ws.send(`Current status: ${paymentStatus.message}`);
  }
});

server.listen(process.env.PORT || 1337, () => {
  console.log("Server running");
});