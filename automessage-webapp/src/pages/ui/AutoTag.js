import React, { useState, useEffect } from "react";
import "../..";
import TagFormsWidget from "./widgets/Autotagwidgets/TagFormsWidget";
import ShiftWidget from "./widgets/Autotagwidgets/ShiftWidget";
import ScheduleWidget from "./widgets/Autotagwidgets/TagScheduleWidget";
import TagTerminalWidget from "./widgets/Autotagwidgets/TagTerminalWidget";
import TagTableWidget from "./widgets/Autotagwidgets/TagTableWidget";
import LinearProgress, {

} from "@mui/material/LinearProgress";
const AutoTagPage = () => {
  const [progress, setProgress] = React.useState(0);
  const [shiftData, setShiftData] = useState({});
  const [formData, setFormData] = useState({});
  const [tagtableData, setTagTableData] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [messages, setMessages] = useState([
    "Welcome Philippians to PGOC Auto Tag WebApp",
  ]);

  const fetchInitialData = () => {
    setTagTableData({});
  };

  useEffect(() => {
    fetchInitialData();
  }, []); // Runs only once when the component mounts

  const addMessage = (newMessage) => {
    if (newMessage.trim() !== "") {
      setMessages((prevMessages) => {
        // Normalize the message by removing content inside square brackets
        const normalize = (message) => message.replace(/\[.*?\]/g, "");

        const normalizedNewMessage = normalize(newMessage);

        // Check if the normalized message already exists
        const isDuplicate = prevMessages.some(
          (msg) => normalize(msg) === normalizedNewMessage
        );

        if (!isDuplicate) {
          // Add the new message if no duplicate is found
          return [...prevMessages, newMessage];
        }

        console.log(`Duplicate message detected: ${newMessage}`);
        return prevMessages; // Keep previous messages unchanged
      });
    }
  };

  useEffect(() => {
    // Load messages from localStorage on component mount
    const storedMessages =
      JSON.parse(localStorage.getItem("Tagmessages")) || [];
    if (storedMessages.length === 0) {
      // Add default message if no messages exist
      storedMessages.push("Welcome Philippians to PGOC Auto Tag WebApp");
    }
    setMessages(storedMessages);
  }, []);

  useEffect(() => {
    // Update localStorage whenever messages change
    localStorage.setItem("Tagmessages", JSON.stringify(messages));
  }, [messages]);

  const resetTerminal = () => {
    setMessages([]);
    // Clear the messages from localStorage
  };

  const handleSubmitTag = () => {
    const data_scheduled_tag = {
      page_id: formData.pageId,
      access_token: formData.accessToken,
      num_iterations: formData.number_of_iteration,
      maximum_worker: formData.maxWorkers,
      tag_id_name: formData.TagId,
      start_date: shiftData.startDate,
      end_date: shiftData.endDate,
      start_hour: shiftData.startHour,
      start_minute: shiftData.startMinute,
      start_second: shiftData.startSecond,
      end_hour: shiftData.endHour,
      end_minute: shiftData.endMinute,
      end_second: shiftData.endSecond,
      start_time: `${String(shiftData.startHour).padStart(2, "0")}:${String(
        shiftData.startMinute
      ).padStart(2, "0")}:${String(shiftData.startSecond).padStart(2, "0")}`,
      end_time: `${String(shiftData.endHour).padStart(2, "0")}:${String(
        shiftData.endMinute
      ).padStart(2, "0")}:${String(shiftData.endSecond).padStart(2, "0")}`,
      schedule_date: scheduleData.startScheduledDate,
      schedule_time: `${scheduleData.scheduleHour}:${scheduleData.scheduleMinute} ${scheduleData.scheduleAmPm}`,
      schedule_hour: scheduleData.scheduleHour,
      schedule_minute: scheduleData.scheduleMinute,
      schedule_second: scheduleData.scheduleAmPm,
      schedule_pattern: scheduleData.repeat,
      schedule_weekly: scheduleData.selectedDay,
      shift: shiftData.shift,
      run_immediately: shiftData.isRunImmediately,
    };

    console.log("Scheduled Tag Data:", data_scheduled_tag);
    alert(JSON.stringify(data_scheduled_tag, null, 2)); // Optional: Display as a popup
  };

  return (
    <div className="p-1">
      {/* Container padding for overall spacing */}
      {/* Flex container with two columns */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* First Column: Forms, Time, and Radio widgets */}
        <div className="space-y-1 flex-shrink-0">
          <h1 className="flex-grow text-[20px] leading-[1.2] text-[#A44444] text-left">
            AutoTag Page
          </h1>

          <TagFormsWidget setFormData={setFormData} />
          <ShiftWidget setShiftData={setShiftData} />
          <div style={{ height: "18px" }}></div>
          <div className="flex items-center space-x-4 mt-4">
            {/* Submit Button */}
            <button
              onClick={() =>
                handleSubmitTag()
              } // Example to increment progress
              className="bg-[#A44444] text-white py-2 px-4 rounded hover:bg-[#861F1F] focus:outline-none "
            >
              Submit
            </button>

            {/* Progress Bar with Percentage */}
            <div className="flex items-center space-x-2 w-full">
              {/* Progress Bar */}
              <div className="w-full">
                <LinearProgress
                  variant="determinate"
                  value={progress} // Dynamic progress value
                  style={{ height: "25px" }} // Adjust height
                  sx={{
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#46923c", // Custom color for the progress bar
                    },
                    backgroundColor: "#e0e0e0", // Optional: background color for the track
                  }}
                />
              </div>
              {/* Progress Percentage Text */}
              <span className="text-[#46923c] font-semibold">{`${progress}%`}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full ">
          <ScheduleWidget setScheduleData={setScheduleData} />
          <div style={{ height: "10px" }}></div>
          <TagTerminalWidget
            messages={messages}
            resetTerminal={resetTerminal}
          />
        </div>
      </div>
      <div style={{ className: "-mt-4" }}></div>
      <TagTableWidget
        tagtableData={tagtableData}
        setTableData={setTagTableData}
        fetchInitialData={fetchInitialData}
        addmessage={addMessage}
      />
    </div>
  );
};

export default AutoTagPage;
