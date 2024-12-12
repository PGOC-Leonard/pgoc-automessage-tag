import React, { useEffect } from "react";
import { FiRotateCcw } from "react-icons/fi"; // Ensure you have react-icons installed

function TerminalWidget({ messages, resetTerminal }) {
  // Effect to auto-scroll when messages change
  useEffect(() => {
    const terminalDiv = document.getElementById("terminal");
    terminalDiv.scrollTop = terminalDiv.scrollHeight; // Scroll to bottom on new message
  }, [messages]); // Trigger this when messages change

  return (
    <div className="relative w-[770px] bg-gray-300  rounded-lg  shadow-xl">
      {/* Reset button placed outside terminal */}
      <button
        onClick={resetTerminal}
        className="absolute top-2 right-2 p-1 rounded-full bg-[#A44444] z-10 hover:bg-[#8A0000]"
        title="Reset Terminal"
      >
        <FiRotateCcw className="text-white" />
      </button>

      {/* Terminal with scrollable content */}
      <div
        id="terminal"
        className="relative w-full h-[300px] bg-gray-200 text-black font-mono p-4 rounded-lg border-2 border-gray-300 shadow-xl overflow-y-auto"
      >
        {/* Messages container */}
        <div className="flex flex-col space-y-2">
          {messages.map((message, index) => (
            <div key={index} className="text-sm">
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TerminalWidget;
