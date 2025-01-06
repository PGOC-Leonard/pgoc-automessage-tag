import React, { useState, useEffect } from "react";
import FormsWidget from "./widgets/Automessagewidgets/FormsWidget";
import "./headings-texts/headings.modules.css";
import TimeWidget from "./widgets/Automessagewidgets/TimeFormWidget";
import RadioWidget from "./widgets/Automessagewidgets/RadioWidget";
import MessageWidget from "./widgets/Automessagewidgets/AddMessageWidget";
import QuickMessageWidget from "./widgets/Automessagewidgets/QuickMessageWidgets";
import TerminalWidget from "./widgets/Automessagewidgets/TerminalWidget";
import StatusWidget from "./widgets/Automessagewidgets/StatusWidget";
import TableTreeWidget from "./widgets/Automessagewidgets/TableTreeWidgets";
import notify from "../components/Toast.js";
import { saveData, fetchData } from "../../services/AutoMessageFunctions.js";
import { format, isEqual } from "date-fns";
import { EventSource } from 'extended-eventsource'; // To format and compare dates

const AutoMessagePage = () => {
  const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;
  const [formData, setFormData] = useState({});
  const [timeData, setTimeData] = useState({});
  const [messageData, setMessageData] = useState({});
  const [methodData, setMethodData] = useState({});
  const [tableData, setTableData] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [statusData, setStatusData] = useState({
    numberOfConversations: "",
    successfulResponses: "",
    failedResponses: "",
  });
  const [currentWidget, setCurrentWidget] = useState("Quick"); // Default to Quick
  const [messages, setMessages] = useState([
    "Welcome Philippians to PGOC Automessage WebApp",
  ]);

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
    const storedMessages = JSON.parse(localStorage.getItem("messages")) || [];
    if (storedMessages.length === 0) {
      // Add default message if no messages exist
      storedMessages.push("Welcome Philippians to PGOC Automessage WebApp");
    }
    setMessages(storedMessages);
  }, []);

  useEffect(() => {
    // Update localStorage whenever messages change
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  const resetTerminal = () => {
    setMessages([]);
    // Clear the messages from localStorage
  };

  const fetchInitialData = async () => {
    const redis_key = localStorage.getItem("redis_key");
    try {
      const response = await fetchData(redis_key);
      if (response && response.data) {
        const Data = response.data; // Get the data from the response
        setTableData(Data); // Set the data to state
        console.log("Table data successfully loaded!", "success");

        let totalConversations = 0;
        let totalSuccess = 0;
        let totalFailures = 0;
        const currentTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");

        Data.forEach((item) => {
          totalConversations += item.conversation_ids || 0;
          totalSuccess += item.successCounts || 0;
          totalFailures += item.failure || 0;


          // Calculate the time difference between current time and scheduled time
          const timeDifference =
            new Date(currentTime) - new Date(item.task_done_time);

          if (item.task_id && item.status === "Scheduled") {
            addMessage(
              `[${currentTime}] Successfully created scheduled message with task id ${item.task_id}`
            );
          }

          // If the current time is exactly equal to scheduled time
          if (
            item.schedule_time &&
            isEqual(new Date(item.task_done_time), new Date(currentTime)) && (item.status === "Success" || item.status === "Failed")

          ) {
            addMessage(
              `[${currentTime}] Sending message to conversations created within past 7 days in page: ${item.page_id} with message title: ${item.message_title} - ${item.schedule_date} ${item.schedule_time}.`
            );
          }

          // Only add messages if the scheduled time is within the last minute
          if (timeDifference <= 60000 && timeDifference >= 0) {
            // 60000 ms = 1 minute
            if (item.status === "Success") {
              addMessage(
                `[${currentTime}] Message successfully sent in page ID: ${item.page_id} with message title: ${item.message_title} - ${item.schedule_date} ${item.schedule_time}`
              );
            } else if (item.status === "Failed") {
              addMessage(
                `[${currentTime}] Sending message failed/error in page ID: ${item.page_id} with message title: ${item.message_title} - ${item.schedule_date} ${item.schedule_time}.`
              );
            }
          } else {
            console.log(
              `Skipping message for Task Id: ${item.task_id} because the scheduled time is more than 1 minute ago.`
            );
          }
        });

        setStatusData({
          numberOfConversations: totalConversations,
          successfulResponses: totalSuccess,
          failedResponses: totalFailures,
        });
      } else {
        console.log("No data found in Redis.", "info");
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setIsDataLoaded(true); // Mark as loaded regardless of success or error
    }
  };

  // UseEffect to establish the SSE connection
  useEffect(() => {
    fetchInitialData();

    const redis_key = localStorage.getItem("redis_key");
    // Create a new EventSource to listen for SSE data from the Flask server
    const eventSource = new EventSource(
      `${apiUrl}/events?key=${redis_key}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        retry: 3000,
      });

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
  }, []);

  const validateForm = () => {
    const missingFields = [];

    // Perform validation for required fields and accumulate missing fields
    if (!formData.pageId) missingFields.push("Page ID");
    if (!formData.accessToken) missingFields.push("Access Token");
    if (!formData.maxWorkers) missingFields.push("Max Workers");
    if (!formData.startDate) missingFields.push("Start Date");
    if (!formData.endDate) missingFields.push("End Date");

    // Check if messageData is empty
    if (messageData.length === 0) {
      notify("There is no message", "error"); // Show error if no messages
      return; // Prevent form submission
    }

    // Check if message data is valid
    messageData.forEach((message, index) => {
      if (!message.message_title) {
        missingFields.push(`Message Title`);
      }
      if (!message.text_message) {
        missingFields.push(`Message Body`);
      }
    });

    // If any field is missing, show error notification
    if (missingFields.length > 0) {
      const errorMessage = missingFields.join(", ");
      notify(`${errorMessage} is missing`, "error"); // Show specific missing field error messages
      return; // Prevent form submission
    }

    // If no missing fields, proceed with form submission
    handleFormSubmit();
  };

  // Collect data from child widgets
  const handleFormSubmit = async () => {
    // Get data from widgets
    const data_scheduled_messages = messageData.map((message) => {
      const data = {
        page_id: formData.pageId,
        access_token: formData.accessToken,
        max_workers: formData.maxWorkers,
        start_date: formData.startDate,
        end_date: formData.endDate,
        message_title: message.message_title,
        method_message: methodData.methodMessage,
        text_message: message.text_message,
        start_hour: timeData.startHour,
        start_minute: timeData.startMinute,
        start_second: timeData.startSecond,
        end_hour: timeData.endHour,
        end_minute: timeData.endMinute,
        end_second: timeData.endSecond,
        start_time: `${String(timeData.startHour).padStart(2, "0")}:${String(
          timeData.startMinute
        ).padStart(2, "0")}:${String(timeData.startSecond).padStart(2, "0")}`,
        end_time: `${String(timeData.endHour).padStart(2, "0")}:${String(
          timeData.endMinute
        ).padStart(2, "0")}:${String(timeData.endSecond).padStart(2, "0")}`,
        schedule_date: message.schedule_date,
        schedule_time: `${message.schedule_hour}:${message.schedule_minute} ${message.schedule_ampm}`,
        schedule_hour: message.schedule_hour,
        schedule_minute: message.schedule_minute,
        schedule_ampm: message.schedule_ampm,
        run_immediately: methodData.isRunImmediately,
        status: "",
      };

      // Remove keys with undefined, null, or empty values
      Object.keys(data).forEach((key) => {
        if (data[key] === undefined || data[key] === null || data[key] === "") {
          delete data[key];
        }
      });

      return data;
    });

    console.log(JSON.stringify(data_scheduled_messages), "success");

    try {
      let duplicates = [];
      let uniqueMessages = [];

      // Check for duplicates
      data_scheduled_messages.forEach((newMessage) => {
        const isDuplicate = tableData.some((existingMessage) => {
          return (
            newMessage.page_id === existingMessage.page_id &&
            newMessage.access_token === existingMessage.access_token &&
            newMessage.max_workers === existingMessage.max_workers &&
            newMessage.message_title === existingMessage.message_title &&
            newMessage.start_date === existingMessage.start_date &&
            newMessage.end_date === existingMessage.end_date &&
            newMessage.start_time === existingMessage.start_time &&
            newMessage.end_time === existingMessage.end_time &&
            newMessage.schedule_date === existingMessage.schedule_date &&
            newMessage.schedule_time === existingMessage.schedule_time
          );
        });

        if (isDuplicate) {
          duplicates.push(newMessage);
        } else {
          uniqueMessages.push(newMessage);
        }
      });

      const totalDuplicates = duplicates.length;

      if (totalDuplicates > 0) {
        notify(
          `Duplicate Message/s ${totalDuplicates} of scheduled message/s has been already scheduled.`,
          "error"
        );
        return; // Stop processing to prevent saving duplicates
      }

      // Merge unique messages with existing table data

      // Save to Redis
      console.log(data_scheduled_messages);
      const response = await saveData(data_scheduled_messages);

      if (response && response.status === 201) {
        fetchInitialData();
        notify("Scheduled Message Created", "success");
      }
    } catch (error) {
      console.error("Error saving table data:", error);
      notify(`${error.message}`, "error");
    }
  };

  const handleMethodChange = (method) => {
    const widget = method === 1 ? "Quick" : "Normal";
    setCurrentWidget(widget);
  };

  return (
    <div className="p-1">
      {/* Container padding for overall spacing */}
      {/* Flex container with two columns */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* First Column: Forms, Time, and Radio widgets */}
        <div className="space-y-1 flex-shrink-0">
          <h1 className="flex-grow text-[20px] leading-[1.2] text-[#A44444] text-left">
            AutoMessagePage
          </h1>

          <FormsWidget setFormData={setFormData} />
          <TimeWidget setTimeData={setTimeData} />
          <RadioWidget
            setMethodData={setMethodData}
            onMethodChange={handleMethodChange}
          />
          {/* Dynamically render the appropriate widget */}
          {currentWidget === "Quick" ? (
            <QuickMessageWidget setMessageData={setMessageData} />
          ) : (
            <MessageWidget setMessageData={setMessageData} />
          )}

          <div style={{ height: "10px" }}></div>

          <div className="flex justify-end mt-6">
            <button
              onClick={validateForm}
              className="bg-gray-500  text-white py-2 px-2 rounded-md hover:bg-gray-600 font-montserrat text-[12px]"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Second Column: MessageWidget */}
        <div className="flex-1 w-full ">
          {/* Submit Button below MessageWidget */}

          {/* TerminalWidget with space above */}
          <div className="mt-6">
            <TerminalWidget messages={messages} resetTerminal={resetTerminal} />
          </div>
          <div style={{ height: "5px" }}></div>
          <StatusWidget
            numberOfConversations={statusData.numberOfConversations}
            successfulResponses={statusData.successfulResponses}
            failedResponses={statusData.failedResponses}
          />
          <div style={{ height: "5px" }}></div>
          <TableTreeWidget
            tableData={tableData}
            setTableData={setTableData}
            fetchInitialData={fetchInitialData}
            addmessage={addMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default AutoMessagePage;
