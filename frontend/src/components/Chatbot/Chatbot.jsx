import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./Chatbot.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: input,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 900,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from Gemini");
      }

      const data = await response.json();
      const botMessage = {
        role: "assistant",
        content:
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, an error occurred. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "👋 Hi! I'm your AI assistant. How can I help you today?",
      },
    ]);
  };

  const saveChatAsPDF = async () => {
    const chatElement = messagesEndRef.current?.parentElement;
    if (!chatElement) return;

    try {
      const canvas = await html2canvas(chatElement, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      let heightLeft = canvas.height * (imgWidth / canvas.width);
      let position = 0;

      // Add title
      pdf.setFontSize(16);
      pdf.text("Chat Conversation", 105, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`Date: ${new Date().toLocaleString()}`, 105, 22, { align: "center" });

      // Add image
      const imgHeight = canvas.height * imgWidth / canvas.width;
      position = 30;
      
      if (heightLeft >= pageHeight - 30) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 30;
        position = heightLeft - imgHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      }

      // Generate PDF as blob and save to localStorage
      const pdfBlob = pdf.output("blob");
      const pdfName = `chat-${new Date().getTime()}.pdf`;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64PDF = reader.result;
        
        // Get existing PDFs from localStorage
        let savedPDFs = JSON.parse(localStorage.getItem("chatPDFs") || "[]");
        
        // Add new PDF
        savedPDFs.push({
          id: new Date().getTime(),
          name: pdfName,
          date: new Date().toLocaleString(),
          size: (pdfBlob.size / 1024).toFixed(2), // KB
          data: base64PDF,
        });
        
        // Save to localStorage
        localStorage.setItem("chatPDFs", JSON.stringify(savedPDFs));
        
        // Also download the PDF
        pdf.save(pdfName);
        alert("PDF saved to dashboard!");
      };
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="chatbot-container">
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Open Chatbot"
      >
        <div className="chatbot-logo">🤖</div>
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="header-logo">🤖</div>
              <h3>Chat Assistant</h3>
            </div>
            <div className="header-buttons">
              <button
                className="save-pdf-btn"
                onClick={saveChatAsPDF}
                title="Save chat as PDF"
              >
                📥
              </button>
              <button
                className="clear-btn"
                onClick={clearChat}
                title="Clear chat history"
              >
                🗑️
              </button>
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
