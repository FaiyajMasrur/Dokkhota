const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const skillRoutes = require("./routes/skillRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const creditRoutes = require("./routes/creditRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const requestRoutes = require("./routes/requestRoutes");


const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const badgeRoutes = require("./routes/badgeRoutes");

const notificationRoutes = require("./routes/notificationRoutes");
const sessionHistoryRoutes = require("./routes/sessionHistoryRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const disputeRoutes = require("./routes/disputeRoutes");

const socketHandler = require("./sockets/socketHandler");

const app = express();
const server = http.createServer(app);

fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

try {
  const { seedCategories } = require("./seedCategories");
  seedCategories().catch((e) =>
    console.warn("Category seeder failed:", e.message)
  );
} catch (e) {}

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/requests", requestRoutes);

app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/badges", badgeRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/session-history", sessionHistoryRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/disputes", disputeRoutes);

app.use("/api/admin", adminRoutes);

app.use(errorHandler);

io.on("connection", (socket) => {
  socketHandler(io, socket);
});

const requestedPort = Number(process.env.PORT || 5000);

const tryListen = (port) => {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const fallbackPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying ${fallbackPort} instead.`);
      tryListen(fallbackPort);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    console.log(`Dokkhota backend running on port ${port}`);
  });
};

tryListen(requestedPort);