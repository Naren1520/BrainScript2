import React, { useState, useEffect } from "react";
import { Save, Trash2, Clock } from "lucide-react";

export default function NotesBox({ videoId, videoTitle, loading = false }) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Fetch notes when video changes
  useEffect(() => {
    if (!videoId) return;
    
    const fetchNotes = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/user/notes/${videoId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.note) {
          setNotes(data.note.content || "");
          setLastSaved(data.note.updatedAt);
          setHasChanges(false);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    fetchNotes();
  }, [videoId, BASE_URL]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setHasChanges(true);
    setSaveStatus("");
  };

  const handleSaveNotes = async () => {
    if (!videoId) return;

    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      const res = await fetch(`${BASE_URL}/api/user/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          videoTitle: videoTitle || "Untitled Video",
          content: notes,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setLastSaved(new Date());
        setHasChanges(false);
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("Failed to save");
      }
    } catch (error) {
      console.error("Save notes error:", error);
      setSaveStatus("Error saving notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNotes = async () => {
    if (!videoId || !window.confirm("Are you sure you want to delete these notes?")) {
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/user/notes/${videoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setNotes("");
        setLastSaved(null);
        setHasChanges(false);
        setSaveStatus("Notes deleted");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("Failed to delete notes");
      }
    } catch (error) {
      console.error("Delete notes error:", error);
      setSaveStatus("Error deleting notes");
    }
  };

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSaveNotes();
    }, 30000); // Auto-save after 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [notes, hasChanges]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📝</span> My Notes
        </h3>
        {lastSaved && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Clock size={12} />
            Last saved: {new Date(lastSaved).toLocaleString()}
          </p>
        )}
      </div>

      {/* Textarea */}
      <div className="flex-1 overflow-hidden p-4">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Type your notes here... They will be automatically saved every 30 seconds."
          className="w-full h-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
          disabled={loading}
        />
      </div>

      {/* Status and Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
        {saveStatus && (
          <div
            className={`text-xs p-2 rounded text-center font-medium ${
              saveStatus.includes("delete")
                ? "bg-orange-100 text-orange-700"
                : saveStatus.includes("Failed") || saveStatus.includes("Error")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {saveStatus}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSaveNotes}
            disabled={isSaving || !hasChanges || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Notes
              </>
            )}
          </button>

          <button
            onClick={handleDeleteNotes}
            disabled={!notes.trim() || loading}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
      </div>
    </div>
  );
}
