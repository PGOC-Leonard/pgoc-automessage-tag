import React, { useState, useEffect } from "react";
import Select from "react-select"; // Import react-select

const TimeWidget = ({setTimeData}) => {
  // State for time values
  const [startHour, setStartHour] = useState("00");
  const [endHour, setEndHour] = useState("23");
  const [startMinute, setStartMinute] = useState("00");
  const [endMinute, setEndMinute] = useState("59");
  const [startSecond, setStartSecond] = useState("00");
  const [endSecond, setEndSecond] = useState("59");


  const updateTimeData = () => {
    const timeData = {
      startHour,
      startMinute,
      startSecond,
      endHour,
      endMinute,
      endSecond,
    };
    setTimeData(timeData);
  };

    // Update parent data whenever local state changes
    useEffect(() => {
      updateTimeData();
    }, [startHour, startMinute, startSecond, endHour, endMinute, endSecond]);

  const handleStartTimeChange = (e, type) => {
    if (type === "hour") {
      setStartHour(e.value);
    } else if (type === "minute") {
      setStartMinute(e.value);
    } else if (type === "second") {
      setStartSecond(e.value);
    }
  };

  const handleEndTimeChange = (e, type) => {
    if (type === "hour") {
      setEndHour(e.value);
    } else if (type === "minute") {
      setEndMinute(e.value);
    } else if (type === "second") {
      setEndSecond(e.value);
    }
  };

  // Options for hours, minutes, and seconds
  const hours = [...Array(24)].map((_, index) => ({
    value: String(index).padStart(2, "0"),
    label: String(index).padStart(2, "0"),
  }));

  const minutesSeconds = [...Array(60)].map((_, index) => ({
    value: String(index).padStart(2, "0"),
    label: String(index).padStart(2, "0"),
  }));

  // Custom styles for react-select
  const customStyles = {
    control: (base) => ({
      ...base,
      width: "80px", // Set width of the select box
      height: "24px", // Set the height of the select box
      fontSize: "12px", // Reduce font size
      padding: "2px", // Smaller padding
      margin: "0px", // Remove margin
    }),
    dropdownIndicator: (base) => ({
      ...base,
      fontSize: "8px", // Smaller dropdown icon
      color: "red", // Set the color of the dropdown icon to red
      padding: "2px", // Smaller padding around the indicator
      margin: "0px", // Remove margin
    }),
    indicatorSeparator: (base) => ({
      display: "none", // Hide the separator line between the icon and the text
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333", // Customize text color inside the select box
      paddingRight: "2px", // Less padding to the right for compactness
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "12px", // Set font size of the menu options to make them smaller
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: "200px", // Control the maximum height of the dropdown
      overflowY: "auto", // Add a scrollbar if the content exceeds the max height
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? "red" : "black", // Set text color to red by default, white when selected
      backgroundColor: state.isFocused ? "#DDB8B8" : "transparent", // Background color change on hover/focus
      fontFamily: "Montserrat, sans-serif", // Ensure Montserrat for option text
    }),
  };

  return (
    <>
      <style>
        {`
    :root {
      --primary-color: #a40404; /* Material Design primary color */
      --text-color: #333;
      --label-color: black;
      --border-color: #ccc;
      --input-background: #f9f9f9;
      --border-radius: 4px;
      --padding: 4px; /* Reduced padding */
      --input-spacing: 10px; /* Reduced spacing between time inputs */
    }

    .widget-container {
      display: grid;
      grid-template-columns: 1fr 2fr; /* One column for labels, another for inputs */
      gap: 10px 10px; /* Reduced gap between columns */
      padding: 10px; /* Reduced padding for compact layout */
      max-width: 500px;
      margin: auto;
      font-family: 'Arial', sans-serif;
      background-color: #fff;
      border-radius: var(--border-radius);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .input-time {
      display: flex;
      align-items: center;
    }

    .input-time .colon {
      margin-left: 5px;
      margin-right: 5px; /* Reduced space around the colon */
    }
  `}
      </style>

      <div className="widget-container ">
        <label className="label">Start Time:</label>
        <div className="input-time">
          <Select
            styles={customStyles} // Apply custom styles
            value={{ value: startHour, label: startHour }}
            onChange={(e) => handleStartTimeChange(e, "hour")}
            options={hours}
            menuPlacement="top" // Make menu show above the select box
          />
          <span className="colon">:</span>
          <Select
            styles={customStyles} // Apply custom styles
            value={{ value: startMinute, label: startMinute }}
            onChange={(e) => handleStartTimeChange(e, "minute")}
            options={minutesSeconds}
            menuPlacement="top" // Make menu show above the select box
          />
          <span className="colon">:</span>
          <Select
            styles={customStyles} // Apply custom styles
            value={{ value: startSecond, label: startSecond }}
            onChange={(e) => handleStartTimeChange(e, "second")}
            options={minutesSeconds}
            menuPlacement="top" // Make menu show above the select box
          />
        </div>
        <label className="label">End Time:</label>
        <div className="input-time">
          <Select
            styles={customStyles} // Apply custom styles
            value={{ value: endHour, label: endHour }}
            onChange={(e) => handleEndTimeChange(e, "hour")}
            options={hours}
            menuPlacement="top" // Make menu show above the select box
          />
          <span className="colon">:</span>
          <Select
            styles={customStyles} // Apply custom styles
            value={{ value: endMinute, label: endMinute }}
            onChange={(e) => handleEndTimeChange(e, "minute")}
            options={minutesSeconds}
            menuPlacement="top" // Make menu show above the select box
          />
          <span className="colon">:</span>
          <Select
            styles={customStyles} // Apply custom styles
            value={{ value: endSecond, label: endSecond }}
            onChange={(e) => handleEndTimeChange(e, "second")}
            options={minutesSeconds}
            menuPlacement="top" // Make menu show above the select box
          />
        </div>
      </div>
    </>
  );
};

export default TimeWidget;
