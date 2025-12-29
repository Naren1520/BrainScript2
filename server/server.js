// server/server.js
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import passport from "passport";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import connectDB from "./src/utils/connectDB.js";
import authRoutes from "./src/routes/auth.js";
import "./src/config/passport.js"; // Passport config

import playlistRoutes from "./src/routes/playlist.js";
import feedRoutes from "./src/routes/feed.js";

import videosRouter from "./src/routes/playerControl/transcript.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import userFilesRoutes from "./src/routes/userFiles.js";

const app = express();

// ✅ Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("trust proxy", true);

// Add referrer policy header
app.use((req, res, next) => {
  res.header("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});

// Session setup
app.use(
  session({
    name: "connect.sid", // Explicitly set cookie name
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies behind a proxy (like Render/Netlify)
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // ✅ Lax is fine because it's now a First-Party cookie via proxy
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("🚀 BrainScript server is running...");
});

// PlAYLIST routes

app.use("/api/playlists", playlistRoutes);

// Feed route
app.use("/api/feed", feedRoutes);

// Player Contorls
app.use("/api/videos", videosRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/user", userFilesRoutes);

// Optional protected test route
app.get("/private", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ success: true, message: "This is a protected route" });
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
