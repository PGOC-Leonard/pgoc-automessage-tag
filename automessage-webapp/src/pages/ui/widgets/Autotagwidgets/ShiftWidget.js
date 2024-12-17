import React, { useState, useEffect } from "react";
import "../../../../index.css";
import "../../buttons/radio-buttons.css";
import DatePicker from "react-datepicker";
import Select from "react-select";

const ShiftWidget = ({ setShiftData, onShiftChange }) => {
  const [runImmediately, setRunImmediately] = useState(false);
  const [shift, setShift] = useState("AM"); // Default: "AM" shift

  const [startDate, setStartDate] = useState(new Date()); // Default start date as current date
  const [endDate, setEndDate] = useState(new Date());

  // State for time values
  const [startHour, setStartHour] = useState("00");
  const [endHour, setEndHour] = useState("23");
  const [startMinute, setStartMinute] = useState("00");
  const [endMinute, setEndMinute] = useState("59");
  const [startSecond, setStartSecond] = useState("00");
  const [endSecond, setEndSecond] = useState("59");

  // Format date function to return 'YYYY-MM-DD' format
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Update parent state whenever local state changes
  useEffect(() => {
    setShiftData({
      isRunImmediately: runImmediately,
      shift: shift, // Send the selected shift (AM/PM)
      startDate: formatDate(startDate), // Send the formatted start date
      endDate: formatDate(endDate),
      startHour: startHour,
      startMinute: startMinute,
      startSecond: startSecond,
      endHour: endHour,
      endMinute: endMinute,
      endSecond: endSecond, // Send the formatted end date
    });
  }, [shift, startDate, endDate, runImmediately, setShiftData]);

  const handleStartTimeChange = (e, type) => {
    if (type === "hour") {
      setStartHour(e.value);
    } else if (type === "minute") {
      setStartMinute(e.value);
    } else if (type === "second") {
      setStartSecond(e.value);
    }
  };

  // Handle changes for 'Run Immediately'
  const handleRunImmediatelyChange = (value) => {
    setRunImmediately(value === "Yes");
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

  // Call parent function on shift change
  useEffect(() => {
    if (onShiftChange) {
      onShiftChange(shift);
    }
  }, [shift, onShiftChange]);

  // Handle changes for 'Shift Selection'
  const handleShiftChange = (value) => {
    setShift(value); // Either "AM" or "PM"
    console.log("Selected Shift:", value); // Log the selected shift value
  };

  // Handle changes in start and end date
  const handleDateChange = (type, date) => {
    if (type === "startDate") {
      setStartDate(date);
    } else if (type === "endDate") {
      setEndDate(date);
    }
  };

  return (
    <div className="w-[500px] bg-white shadow-md rounded-md font-montserrat pl-2 pt-5 pb-1">
      {/* Shift Section (AM/PM) */}
      <div className="flex items-center gap-4 mb-4 flex-nowrap">
        <span className="radio-label">Shift : </span>
        <div style={{ width: "5px" }}></div>

        <label className="radio-label flex items-center">
          <input
            type="radio"
            name="shift"
            value="AM"
            checked={shift === "AM"}
            onChange={() => handleShiftChange("AM")}
            className="mr-2"
          />
          <div className="radio-custom"></div>
          <span className="radio-text">AM Shift</span>
        </label>

        <label className="radio-label flex items-center">
          <input
            type="radio"
            name="shift"
            value="PM"
            checked={shift === "PM"}
            onChange={() => handleShiftChange("PM")}
            className="mr-2"
          />
          <div className="radio-custom"></div>
          <span className="radio-text">PM Shift</span>
        </label>
      </div>

      {/* Run Immediately */}
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

      {/* Date Section */}
      <div className="flex mb-1 gap-4">
        <div className="form-group flex items-center gap-2">
          <label className="label text-sm mr-2 mt-4" htmlFor="start-date">
            Start Date (YYYY-MM-DD):
          </label>
          <DatePicker
            id="start-date"
            className="react-datepicker-wrapper p-0 w-full"
            selected={startDate} // Use the state value for the selected date
            onChange={(date) => handleDateChange("startDate", date)} // Handle start date change
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            maxDate={endDate} // Max date should be the selected end date
          />
        </div>
      </div>

      {/* End Date Section */}
      <div className="flex mb-4 gap-4">
        <div className="form-group flex items-center gap-2">
          <label className="label text-sm mr-3 mt-4" htmlFor="end-date">
            End Date (YYYY-MM-DD):
          </label>
          <DatePicker
            id="end-date"
            className="react-datepicker-wrapper p-0 w-full"
            selected={endDate} // Use the state value for the selected date
            onChange={(date) => handleDateChange("endDate", date)} // Handle end date change
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            minDate={startDate} // Min date should be the selected start date
          />
        </div>
      </div>

      {/* Start Time Section */}
      <div className="flex mb-2 gap-4">
        <label className="label mr-3">Start Time (HH/MM/SS):</label>
        <div className="flex gap-2 items-center">
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
      </div>

      {/* End Time Section */}
      <div className="flex mb-4 gap-4">
        <label className="label mr-4">End Time (HH/MM/SS):</label>
        <div className="flex gap-2 items-center">
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
    </div>
  );
};

export default ShiftWidget;
