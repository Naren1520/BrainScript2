import express from "express";
import User from "../models/User.js";
import { upload } from "../utils/uploadConfig.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// GET /api/user/dashboard - Get all user data for dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Initialize fields if missing
    if (!user.stats)
      user.stats = {
        totalWatchTime: 0,
        totalQuizzesSolved: 0,
        topicsCleared: [],
      };
    if (!user.dailyActivity) user.dailyActivity = [];
    if (!user.quizHistory) user.quizHistory = [];

    // Calculate Streak
    let streak = 0;
    const sortedActivity = user.dailyActivity.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // Check if active today or yesterday to start streak
    let currentCheck = new Date();
    if (sortedActivity.length > 0) {
      const lastActive = sortedActivity[0].date;
      if (lastActive === today || lastActive === yesterday) {
        streak = 1;
        // Simple logic: iterate backwards checking for consecutive days
        for (let i = 1; i < sortedActivity.length; i++) {
          const prevDate = new Date(sortedActivity[i - 1].date);
          const currDate = new Date(sortedActivity[i].date);
          const diffTime = Math.abs(prevDate - currDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      stats: user.stats,
      dailyActivity: user.dailyActivity,
      quizHistory: user.quizHistory,
      streak,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        profileImage: user.profileImage || "",
        lastLogin: user.lastLogin,
        accountType: user.accountType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ... (existing code) ...

// PUT /api/user/profile - Update user profile
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { name, accountType } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const updateData = { name: name.trim() };
    if (accountType) {
      updateData.accountType = accountType;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        profileImage: user.profileImage || "",
        lastLogin: user.lastLogin,
        accountType: user.accountType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/quiz-result - Save quiz result
router.post("/quiz-result", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, score, totalQuestions, difficulty, topics } =
      req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Add to history
    user.quizHistory.push({
      date: new Date(),
      videoId,
      videoTitle,
      score,
      totalQuestions,
      difficulty,
    });

    // Update stats
    if (!user.stats) {
      user.stats = {
        totalWatchTime: 0,
        totalQuizzesSolved: 0,
        topicsCleared: [],
      };
    }
    user.stats.totalQuizzesSolved += 1;

    // Update topics
    if (topics && Array.isArray(topics)) {
      topics.forEach((topic) => {
        if (!user.stats.topicsCleared.includes(topic)) {
          user.stats.topicsCleared.push(topic);
        }
      });
    }

    await user.save();

    res.json({ success: true, quizHistory: user.quizHistory });
  } catch (error) {
    console.error("Save Quiz Result Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/track - Track user activity (watch time, app open time)
router.post("/track", isAuthenticated, async (req, res) => {
  try {
    const { videoId, watchTime, appOpenTime, title, thumbnailUrl, playlistId } =
      req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    let todayActivity = user.dailyActivity.find((a) => a.date === today);

    if (!todayActivity) {
      todayActivity = {
        date: today,
        watchTime: 0,
        appOpenTime: 0,
        videosWatched: [],
        loginCount: 1,
      };
      user.dailyActivity.push(todayActivity);
      todayActivity = user.dailyActivity[user.dailyActivity.length - 1];
    }

    // Update Watch Time
    if (watchTime && typeof watchTime === "number") {
      user.stats.totalWatchTime = (user.stats.totalWatchTime || 0) + watchTime;
      todayActivity.watchTime = (todayActivity.watchTime || 0) + watchTime;
    }

    // Update App Open Time
    if (appOpenTime && typeof appOpenTime === "number") {
      todayActivity.appOpenTime =
        (todayActivity.appOpenTime || 0) + appOpenTime;
    }

    // Track Video & Learning Progress
    if (videoId) {
      if (!todayActivity.videosWatched.includes(videoId)) {
        todayActivity.videosWatched.push(videoId);
      }

      // Update Learning Progress (Continue Watching)
      if (title) {
        // Remove existing entry for this video
        if (!user.learningProgress) user.learningProgress = [];
        user.learningProgress = user.learningProgress.filter(
          (p) => p.videoId !== videoId
        );

        // Add new entry to top
        user.learningProgress.unshift({
          videoId,
          title,
          thumbnailUrl,
          playlistId,
          lastWatched: new Date(),
        });

        // Keep only last 20
        if (user.learningProgress.length > 20) {
          user.learningProgress = user.learningProgress.slice(0, 20);
        }
      }
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/learning-history - Get data for My Learning page
router.get("/learning-history", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Continue Watching
    const continueWatching = user.learningProgress || [];

    // 2. Smart Review (Low score quizzes)
    // Filter for quizzes with score < 60%
    const lowScoreQuizzes = (user.quizHistory || [])
      .filter((q) => q.totalQuestions > 0 && q.score / q.totalQuestions < 0.6)
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
      .slice(0, 10); // Limit to 10

    // Map to a cleaner format
    const smartReview = lowScoreQuizzes.map((q) => ({
      videoId: q.videoId,
      title: q.videoTitle || "Unknown Video",
      score: q.score,
      totalQuestions: q.totalQuestions,
      date: q.date,
    }));

    res.json({
      continueWatching,
      smartReview,
    });
  } catch (error) {
    console.error("Learning History Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/upload-profile-image - Upload profile image
router.post("/upload-profile-image", isAuthenticated, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      // Delete the uploaded file if user not found
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old profile image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(".", user.profileImage);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error("Error deleting old profile image:", err);
      });
    }

    // Save the new image path (relative to server root)
    const imagePath = `uploads/profiles/${req.file.filename}`;
    user.profileImage = imagePath;
    await user.save();

    res.json({
      success: true,
      profileImage: imagePath,
      message: "Profile image uploaded successfully",
    });
  } catch (error) {
    console.error("Upload Profile Image Error:", error);
    
    // Delete the uploaded file if there's an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(500).json({ error: "Failed to upload profile image" });
  }
});

// GET /api/user/profile-image/:userId - Get profile image URL
router.get("/profile-image/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.profileImage) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    res.json({ profileImage: user.profileImage });
  } catch (error) {
    console.error("Get Profile Image Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/notes - Save or update notes for a video
router.post("/notes", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, content } = req.body;
    const userId = req.user._id || req.user.id;

    if (!videoId) {
      return res.status(400).json({ error: "videoId is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Initialize notes array if missing
    if (!user.notes) {
      user.notes = [];
    }

    // Find existing note for this video
    const existingNoteIndex = user.notes.findIndex(
      (note) => note.videoId === videoId
    );

    if (existingNoteIndex >= 0) {
      // Update existing note
      user.notes[existingNoteIndex].content = content;
      user.notes[existingNoteIndex].updatedAt = new Date();
    } else {
      // Create new note
      user.notes.push({
        videoId,
        videoTitle: videoTitle || "Untitled Video",
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await user.save();

    res.json({
      success: true,
      message: "Note saved successfully",
      note: user.notes.find((note) => note.videoId === videoId),
    });
  } catch (error) {
    console.error("Save Note Error:", error);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// GET /api/user/notes/:videoId - Get notes for a specific video
router.get("/notes/:videoId", isAuthenticated, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const note = user.notes?.find((note) => note.videoId === videoId);

    if (!note) {
      return res.json({
        success: true,
        note: {
          videoId,
          content: "",
          createdAt: null,
          updatedAt: null,
        },
      });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error("Get Note Error:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// DELETE /api/user/notes/:videoId - Delete notes for a specific video
router.delete("/notes/:videoId", isAuthenticated, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.notes) {
      return res.status(404).json({ error: "No notes found for this video" });
    }

    const noteIndex = user.notes.findIndex((note) => note.videoId === videoId);
    if (noteIndex < 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    user.notes.splice(noteIndex, 1);
    await user.save();

    res.json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete Note Error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
