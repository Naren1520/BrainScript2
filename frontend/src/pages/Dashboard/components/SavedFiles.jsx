import React, { useState, useEffect } from "react";
import { Download, Trash2, Heart, FileText, BookOpen, Archive } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SavedFiles = () => {
  const [activeTab, setActiveTab] = useState("all"); // all, transcripts, summaries, downloads
  const [files, setFiles] = useState({
    transcripts: [],
    summaries: [],
    downloads: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/user/files`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data);
      setError("");
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (fileType, fileId) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/user/files/${fileType}/${fileId}/toggle-favorite`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to toggle favorite");
      
      // Update local state
      const key = fileType === "downloads" ? "downloads" : fileType + "s";
      setFiles((prev) => ({
        ...prev,
        [key]: prev[key].map((file) =>
          file._id === fileId ? { ...file, isFavorite: !file.isFavorite } : file
        ),
      }));
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const deleteFile = async (fileType, fileId) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/user/files/${fileType}/${fileId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to delete file");
      
      // Update local state
      const key = fileType === "downloads" ? "downloads" : fileType + "s";
      setFiles((prev) => ({
        ...prev,
        [key]: prev[key].filter((file) => file._id !== fileId),
      }));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const downloadAsText = (content, fileName) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderFileCard = (file, fileType) => {
    const isFavorite = file.isFavorite || false;
    const createdAt = new Date(file.createdAt || file.savedAt || file.downloadedAt).toLocaleDateString();

    return (
      <div
        key={file._id}
        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            {fileType === "transcripts" && (
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
            )}
            {fileType === "summaries" && (
              <BookOpen className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
            )}
            {fileType === "downloads" && (
              <Archive className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {file.videoTitle || file.fileName || "Untitled"}
              </h3>
              <p className="text-sm text-gray-500">
                {createdAt}
                {fileType === "downloads" && file.fileSize && (
                  <span className="ml-2">
                    • {(file.fileSize / 1024).toFixed(2)} KB
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(fileType, file._id)}
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <Heart
              className="w-5 h-5"
              fill={isFavorite ? "currentColor" : "none"}
              color={isFavorite ? "#ef4444" : "currentColor"}
            />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded p-3 mb-3 max-h-24 overflow-y-auto text-sm text-gray-700 font-mono">
          {file.transcript || file.summary || file.content ? (
            <p className="text-xs line-clamp-4">
              {(file.transcript || file.summary || file.content).substring(0, 200)}...
            </p>
          ) : (
            <p className="text-xs text-gray-400">No preview available</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              const fileName = `${file.videoTitle || "file"}_${fileType}.txt`;
              downloadAsText(
                file.transcript || file.summary || file.content || "",
                fileName
              );
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => deleteFile(fileType, file._id)}
            className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const totalFiles =
    files.transcripts.length + files.summaries.length + files.downloads.length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          My Learning Files
        </h2>
        <p className="text-gray-600">
          Total saved files: <span className="font-semibold">{totalFiles}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "all", label: "All Files", count: totalFiles },
          { id: "transcripts", label: "Transcripts", count: files.transcripts.length },
          { id: "summaries", label: "Summaries", count: files.summaries.length },
          { id: "downloads", label: "Downloads", count: files.downloads.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === "all" ? (
          <>
            {files.transcripts.length === 0 &&
            files.summaries.length === 0 &&
            files.downloads.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No files saved yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Download, summarize, or save transcripts to see them here
                </p>
              </div>
            ) : (
              <>
                {files.transcripts.map((file) =>
                  renderFileCard(file, "transcripts")
                )}
                {files.summaries.map((file) =>
                  renderFileCard(file, "summaries")
                )}
                {files.downloads.map((file) =>
                  renderFileCard(file, "downloads")
                )}
              </>
            )}
          </>
        ) : activeTab === "transcripts" ? (
          files.transcripts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transcripts saved</p>
            </div>
          ) : (
            files.transcripts.map((file) =>
              renderFileCard(file, "transcripts")
            )
          )
        ) : activeTab === "summaries" ? (
          files.summaries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No summaries saved</p>
            </div>
          ) : (
            files.summaries.map((file) => renderFileCard(file, "summaries"))
          )
        ) : (
          // downloads
          files.downloads.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No downloads recorded</p>
            </div>
          ) : (
            files.downloads.map((file) => renderFileCard(file, "downloads"))
          )
        )}
      </div>
    </div>
  );
};

export default SavedFiles;
