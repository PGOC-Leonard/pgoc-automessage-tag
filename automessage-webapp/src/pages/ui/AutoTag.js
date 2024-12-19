import React, { useState, useEffect } from "react";
import "../..";
import TagFormsWidget from "./widgets/Autotagwidgets/TagFormsWidget";
import ShiftWidget from "./widgets/Autotagwidgets/ShiftWidget";
import ScheduleWidget from "./widgets/Autotagwidgets/TagScheduleWidget";
import TagTerminalWidget from "./widgets/Autotagwidgets/TagTerminalWidget";
import TagTableWidget from "./widgets/Autotagwidgets/TagTableWidget";
import notify from "../components/Toast.js";
import LinearProgress from "@mui/material/LinearProgress";
import { fetchDataTag, saveTagData } from "../../services/AutoTagFunctions.js";
const AutoTagPage = () => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [progress, setProgress] = React.useState(0);
  const [shiftData, setShiftData] = useState({});
  const [formData, setFormData] = useState({});
  const [tagtableData, setTagTableData] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [messages, setMessages] = useState([
    "Welcome Philippians to PGOC Auto Tag WebApp",
  ]);

  const fetchInitialData = async () => {
    const redis_key = localStorage.getItem("redis_key");
  
    try {
      const response = await fetchDataTag(redis_key);
  
      if (response && response.data) {
        const Data = response.data; // Get the data from the response
  
        // Find the latest index entry
        const latestIndexData = Data.sort((a, b) => b.index - a.index)[0]; // Sort by index in descending order
  
        if (latestIndexData) {
          // Ensure progress key is present and not None
          const progressValue = latestIndexData.progress != null ? latestIndexData.progress : 0;
          setProgress(progressValue);
        }
  
        setTagTableData(Data); // Set the data to state
        console.log("Table data successfully loaded!", "success");
      } else {
        console.log("No data found in Redis.", "info");
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
    }
  };
  

  // UseEffect to establish the SSE connection
  useEffect(() => {
    fetchInitialData();

    const redis_key = localStorage.getItem("redis_key");
    // Create a new EventSource to listen for SSE data from the Flask server
    const eventSource = new EventSource(`${apiUrl}/tagevents?key=${redis_key}`);

    // Handle incoming messages from the server
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("Received SSE:", parsedData);

        // Parse the data if it's JSON formatted (optional, depends on your server)

        // Handle specific signals or events
        if (parsedData.eventType === "update") {
          fetchInitialData();
          console.log("Data was updated", "success");
          // You can call specific functions here, like fetchInitialData()
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    // Handle errors with the SSE connection
    eventSource.onerror = (error) => {
      console.error("Error with SSE:", error);
      eventSource.close(); // Close the connection on error
    };

    // Clean up the event source when the component unmounts
    return () => {
      eventSource.close();
    };
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

  const validateForm = () => {
    const missingFields = [];

    // Perform validation for required fields and accumulate missing fields
    if (!formData.pageId) missingFields.push("Page ID");
    if (!formData.accessToken) missingFields.push("Access Token");
    if (!formData.maxWorkers) missingFields.push("Max Workers");
    if (!formData.number_of_iteration)
      missingFields.push("Number of Iteration");
    if (!formData.TagId) missingFields.push("Tag Id");

    // If any field is missing, show error notification
    if (missingFields.length > 0) {
      const errorMessage = missingFields.join(", ");
      notify(`${errorMessage} is missing`, "error"); // Show specific missing field error messages
      return; // Prevent form submission
    }

    // If no missing fields, proceed with form submission
    handleSubmitTag();
  };

  const handleSubmitTag = async () => {
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
      schedule_enddate:scheduleData.endScheduledDate,
      schedule_time: `${scheduleData.scheduleHour}:${scheduleData.scheduleMinute} ${scheduleData.scheduleAmPm}`,
      schedule_hour: scheduleData.scheduleHour,
      schedule_minute: scheduleData.scheduleMinute,
      schedule_second: scheduleData.scheduleAmPm,
      schedule_pattern: scheduleData.repeat,
      schedule_weekly: scheduleData.selectedDay,
      shift: shiftData.shift,
      run_immediately: shiftData.isRunImmediately,
    };
  
    try {
      // Check for duplicates
      const isDuplicate = tagtableData.some((existingTags) => {
        return (
          data_scheduled_tag.page_id === existingTags.page_id &&
          data_scheduled_tag.access_token === existingTags.access_token &&
          data_scheduled_tag.maximum_worker === existingTags.maximum_worker &&
          data_scheduled_tag.tag_id_name === existingTags.tag_id_name &&
          data_scheduled_tag.start_date === existingTags.start_date &&
          data_scheduled_tag.end_date === existingTags.end_date &&
          data_scheduled_tag.start_time === existingTags.start_time &&
          data_scheduled_tag.end_time === existingTags.end_time &&
          data_scheduled_tag.schedule_date === existingTags.schedule_date &&
          data_scheduled_tag.schedule_time === existingTags.schedule_time
        );
      });
  
      if (isDuplicate) {
        notify("Duplicate Message: This scheduled message already exists.", "error");
        return; // Stop processing to prevent saving duplicates
      }
  
      // Save to Redis
      console.log(data_scheduled_tag);
      const response = await saveTagData([data_scheduled_tag]);
  
      if (response && response.status === 201) {
        fetchInitialData();
        notify("Scheduled Message Created", "success");
      }
    } catch (error) {
      console.error("Error saving table data:", error);
      notify(`${error.message}`, "error");
    }
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
              onClick={() => validateForm()} // Example to increment progress
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
