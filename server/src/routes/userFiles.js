import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// POST /api/user/save-transcript - Save transcript
router.post("/save-transcript", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, transcript, language = "en" } = req.body;
    const userId = req.user._id || req.user.id;

    if (!videoId || !transcript) {
      return res.status(400).json({ error: "videoId and transcript are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if transcript already exists
    const existingIndex = user.transcripts.findIndex(
      (t) => t.videoId === videoId && t.language === language
    );

    if (existingIndex !== -1) {
      // Update existing transcript
      user.transcripts[existingIndex] = {
        videoId,
        videoTitle,
        transcript,
        language,
        savedAt: new Date(),
        isFavorite: user.transcripts[existingIndex].isFavorite || false,
      };
    } else {
      // Add new transcript
      user.transcripts.push({
        videoId,
        videoTitle,
        transcript,
        language,
        savedAt: new Date(),
        isFavorite: false,
      });
    }

    await user.save();
    res.json({ success: true, message: "Transcript saved successfully" });
  } catch (error) {
    console.error("Save Transcript Error:", error);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

// POST /api/user/save-summary - Save summary
router.post("/save-summary", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, summary } = req.body;
    const userId = req.user._id || req.user.id;

    if (!videoId || !summary) {
      return res.status(400).json({ error: "videoId and summary are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if summary already exists
    const existingIndex = user.summaries.findIndex((s) => s.videoId === videoId);

    if (existingIndex !== -1) {
      // Update existing summary
      user.summaries[existingIndex] = {
        videoId,
        videoTitle,
        summary,
        createdAt: new Date(),
        isFavorite: user.summaries[existingIndex].isFavorite || false,
      };
    } else {
      // Add new summary
      user.summaries.push({
        videoId,
        videoTitle,
        summary,
        createdAt: new Date(),
        isFavorite: false,
      });
    }

    await user.save();
    res.json({ success: true, message: "Summary saved successfully" });
  } catch (error) {
    console.error("Save Summary Error:", error);
    res.status(500).json({ error: "Failed to save summary" });
  }
});

// POST /api/user/save-download - Save download record
router.post("/save-download", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, fileType, fileName, content, fileSize } = req.body;
    const userId = req.user._id || req.user.id;

    if (!videoId || !fileType || !fileName) {
      return res.status(400).json({ error: "videoId, fileType, and fileName are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.downloads.push({
      videoId,
      videoTitle,
      fileType,
      fileName,
      content,
      fileSize: fileSize || 0,
      downloadedAt: new Date(),
    });

    await user.save();
    res.json({ success: true, message: "Download recorded successfully" });
  } catch (error) {
    console.error("Save Download Error:", error);
    res.status(500).json({ error: "Failed to record download" });
  }
});

// GET /api/user/files - Get all user files (transcripts, summaries, downloads)
router.get("/files", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select(
      "transcripts summaries downloads"
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      transcripts: user.transcripts || [],
      summaries: user.summaries || [],
      downloads: user.downloads || [],
    });
  } catch (error) {
    console.error("Get Files Error:", error);
    res.status(500).json({ error: "Failed to retrieve files" });
  }
});

// GET /api/user/files/:fileType - Get files by type
router.get("/files/:fileType", isAuthenticated, async (req, res) => {
  try {
    const { fileType } = req.params; // transcript, summary, or downloads
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    let files = [];
    if (fileType === "transcript") {
      files = user.transcripts || [];
    } else if (fileType === "summary") {
      files = user.summaries || [];
    } else if (fileType === "downloads") {
      files = user.downloads || [];
    } else {
      return res.status(400).json({ error: "Invalid file type" });
    }

    res.json({ fileType, files });
  } catch (error) {
    console.error("Get Files Error:", error);
    res.status(500).json({ error: "Failed to retrieve files" });
  }
});

// PUT /api/user/files/:fileType/:fileId/toggle-favorite - Toggle favorite
router.put("/files/:fileType/:fileId/toggle-favorite", isAuthenticated, async (req, res) => {
  try {
    const { fileType, fileId } = req.params;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    let file;
    if (fileType === "transcript") {
      file = user.transcripts.id(fileId);
    } else if (fileType === "summary") {
      file = user.summaries.id(fileId);
    } else {
      return res.status(400).json({ error: "Invalid file type" });
    }

    if (!file) return res.status(404).json({ error: "File not found" });

    file.isFavorite = !file.isFavorite;
    await user.save();

    res.json({ success: true, isFavorite: file.isFavorite });
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    res.status(500).json({ error: "Failed to update favorite status" });
  }
});

// DELETE /api/user/files/:fileType/:fileId - Delete a file
router.delete("/files/:fileType/:fileId", isAuthenticated, async (req, res) => {
  try {
    const { fileType, fileId } = req.params;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (fileType === "transcript") {
      user.transcripts.id(fileId).deleteOne();
    } else if (fileType === "summary") {
      user.summaries.id(fileId).deleteOne();
    } else if (fileType === "downloads") {
      user.downloads.id(fileId).deleteOne();
    } else {
      return res.status(400).json({ error: "Invalid file type" });
    }

    await user.save();
    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete File Error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
