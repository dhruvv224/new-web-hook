const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

let myWs;
let paymentStatus = null; // 🔹 store latest payment status

// Webhooks (called by payment portal)
app.post("/hooks/payment_success", (req, res) => {
  console.log("Payment success");

  paymentStatus = {
    status: "success",
    code: 200,
    message: "Payment successful",
  };

  if (myWs) {
    myWs.send("Payment success"); // 🔥 notify frontend via socket
  }

  res.status(200).json({ message: "Webhook received" });
});

app.post("/hooks/payment_failure", (req, res) => {
  console.log("Payment failure");

  paymentStatus = {
    status: "fail",
    code: 400,
    message: "Payment failed",
  };

  if (myWs) {
    myWs.send("Payment failure"); // 🔥 notify frontend via socket
  }

  res.status(200).json({ message: "Webhook received" });
});

// New API for frontend (without socket)
app.get("/response/status", (req, res) => {
  console.log(paymentStatus,":paymentStatus")
  if (!paymentStatus) {
    return res.status(404).json({
      status: "pending",
      code: 102,
      message: "Payment not received yet",
    });
  }
  return res.status(paymentStatus.code).json(paymentStatus);
});

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
