require("dotenv").config();

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initializeSocket = require("./socket/socket");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const dailyProductRoutes = require("./routes/dailyProductRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const reportRoutes = require("./routes/reportRoutes");
const customerAnalyticsRoutes = require("./routes/customerAnalyticsRoutes");

const app = express();

/* ================================
   SECURITY
================================ */

app.set("trust proxy", 1);

app.use(helmet());

app.use(hpp());

/* ================================
   BODY PARSER
================================ */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/* ================================
   DATABASE
================================ */

connectDB();

/* ================================
   CORS
================================ */

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

/* ================================
   AUTH RATE LIMITER
================================ */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again later.",
  },
});

/* ================================
   API ROUTES
================================ */

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/daily-products",
  dailyProductRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/receipts",
  receiptRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

app.use(
  "/api/customer-analytics",
  customerAnalyticsRoutes
);

/* ================================
   HEALTH CHECK
================================ */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Fish & Meat Shop API is running",
  });
});

/* ================================
   GLOBAL ERROR HANDLER
================================ */

app.use((err, req, res, next) => {
  console.error(
    "GLOBAL ERROR:",
    err
  );

  res.status(err.status || 500).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

/* ================================
   HTTP SERVER
================================ */

const server = http.createServer(app);

/* ================================
   SOCKET.IO
================================ */

const io = new Server(server, {
  cors: {
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
    ],

    credentials: true,
  },
});

app.set("io", io);

initializeSocket(io);

/* ================================
   SERVER START
================================ */

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Socket.IO running on port ${PORT}`
    );
  }
);