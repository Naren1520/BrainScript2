import React, { useEffect, useState, useRef } from "react";

const SavedChatPDFs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadPDFs = () => {
      try {
        const savedPDFs = JSON.parse(localStorage.getItem("chatPDFs") || "[]");
        setPdfs(savedPDFs.reverse()); // Show newest first
      } catch (error) {
        console.error("Error loading PDFs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPDFs();
  }, []);

  const handleImportPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64PDF = reader.result;

        // Get existing PDFs from localStorage
        const savedPDFs = JSON.parse(localStorage.getItem("chatPDFs") || "[]");

        // Add new PDF
        savedPDFs.push({
          id: new Date().getTime(),
          name: file.name,
          date: new Date().toLocaleString(),
          size: (file.size / 1024).toFixed(2), // KB
          data: base64PDF,
          isImported: true,
        });

        // Save to localStorage
        localStorage.setItem("chatPDFs", JSON.stringify(savedPDFs));
        setPdfs(savedPDFs.reverse());
        alert("PDF imported successfully!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error importing PDF:", error);
      alert("Failed to import PDF. Please try again.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadPDF = (pdfData, pdfName) => {
    const link = document.createElement("a");
    link.href = pdfData;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deletePDF = (id) => {
    if (window.confirm("Are you sure you want to delete this PDF?")) {
      const updatedPDFs = pdfs.filter((pdf) => pdf.id !== id);
      localStorage.setItem("chatPDFs", JSON.stringify(updatedPDFs));
      setPdfs(updatedPDFs);
    }
  };

  const startRename = (pdf) => {
    setRenamingId(pdf.id);
    setNewName(pdf.name);
  };

  const saveName = (id) => {
    if (!newName.trim()) {
      alert("Name cannot be empty");
      return;
    }

    const updatedPDFs = pdfs.map((pdf) =>
      pdf.id === id ? { ...pdf, name: newName } : pdf
    );
    localStorage.setItem("chatPDFs", JSON.stringify(updatedPDFs));
    setPdfs(updatedPDFs);
    setRenamingId(null);
    setNewName("");
  };

  if (loading) {
    return <div className="text-center py-8">Loading PDFs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>📄</span> Saved PDFs
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          ➕ Import PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleImportPDF}
          className="hidden"
        />
      </div>

      {pdfs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No saved PDFs yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Save chat conversations or import PDFs to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {renamingId === pdf.id ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveName(pdf.id)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="px-3 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h4
                      className="font-semibold text-gray-800 break-all cursor-pointer hover:text-blue-600"
                      onClick={() => setViewingPDF(pdf)}
                      title="Click to view PDF"
                    >
                      {pdf.name}
                    </h4>
                  )}
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p>📅 {pdf.date}</p>
                    <p>📦 {pdf.size} KB</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-wrap justify-end">
                  <button
                    onClick={() => startRename(pdf)}
                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                    title="Rename PDF"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => downloadPDF(pdf.data, pdf.name)}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    title="Download PDF"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => deletePDF(pdf.id)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    title="Delete PDF"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Screen PDF Viewer */}
      {viewingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
            <h2 className="text-lg font-semibold truncate">{viewingPDF.name}</h2>
            <button
              onClick={() => setViewingPDF(null)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white"
            >
              ✕ Close
            </button>
          </div>
          <iframe
            src={viewingPDF.data}
            className="flex-1 w-full border-0"
            title="PDF Viewer"
          />
        </div>
      )}
    </div>
  );
};

export default SavedChatPDFs;
