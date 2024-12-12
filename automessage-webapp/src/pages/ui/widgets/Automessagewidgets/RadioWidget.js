import React, { useState, useEffect } from "react";
import "../../../../index.css";
import "../../buttons/radio-buttons.css"; // Path to your custom radio buttons CSS

const RadioWidget = ({ setMethodData, onMethodChange }) => {
  const [runImmediately, setRunImmediately] = useState(false); // Default: "No" => false
  const [messageMethod, setMessageMethod] = useState(1); // Default: "Quick" => 1

  // Update parent state whenever local state changes
  useEffect(() => {
    setMethodData({
      isRunImmediately: runImmediately,
      methodMessage: messageMethod,
    });
  }, [runImmediately, messageMethod, setMethodData]);

  // Call parent function on method change
  useEffect(() => {
    if (onMethodChange) {
      onMethodChange(messageMethod);
    }
  }, [messageMethod, onMethodChange]);

  // Handle changes for 'Run Immediately'
  const handleRunImmediatelyChange = (value) => {
    setRunImmediately(value === "Yes");
  };

  // Handle changes for 'Message Method'
  const handleMessageMethodChange = (value) => {
    const method = value === "Quick" ? 1 : 0;
    setMessageMethod(method);
  };

  return (
    <div className="w-[500px] bg-white shadow-md rounded-md font-montserrat pl-2 pt-3 pb-1 ">
      {/* Run Immediately Section */}
      <div className="flex items-center gap-4 mb-4 flex-nowrap">
        <span className="radio-label">Run Immediately?</span>
        <div style={{ width: "5px" }}></div>

        <label className="radio-label flex items-center">
          <input
            type="radio"
            name="run-immediately"
            value="Yes"
            checked={runImmediately === true}
            onChange={() => handleRunImmediatelyChange("Yes")}
            className="mr-2"
          />
          <div className="radio-custom"></div>
          <span className="radio-text">Yes</span>
        </label>

        <label className="radio-label flex items-center">
          <input
            type="radio"
            name="run-immediately"
            value="No"
            checked={runImmediately === false}
            onChange={() => handleRunImmediatelyChange("No")}
            className="mr-2"
          />
          <div className="radio-custom"></div>
          <span className="radio-text">No</span>
        </label>
      </div>

      {/* Message Method Section */}
      <div className="flex items-center gap-4 mb-4 flex-nowrap ">
        <span className="radio-label">Message Method</span>

        <label className="radio-label flex items-center">
          <input
            type="radio"
            name="message-method"
            value="Quick"
            checked={messageMethod === 1}
            onChange={() => handleMessageMethodChange("Quick")}
            className="mr-2"
          />
          <div className="radio-custom"></div>
          <span className="radio-text">Quick Message</span>
        </label>

        <label className="radio-label flex items-center">
          <input
            type="radio"
            name="message-method"
            value="Normal"
            checked={messageMethod === 0}
            onChange={() => handleMessageMethodChange("Normal")}
            className="mr-2"
          />
          <div className="radio-custom"></div>
          <span className="radio-text">Normal Message</span>
        </label>
      </div>
    </div>
  );
};

export default RadioWidget;
