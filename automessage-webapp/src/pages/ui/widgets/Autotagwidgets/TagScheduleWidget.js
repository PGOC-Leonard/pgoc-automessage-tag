import React, { useState, useEffect } from "react";
import "../../../../index.css";
import "../../buttons/radio-buttons.css";
import DatePicker from "react-datepicker";
import Select from "react-select";

const ScheduleWidget = ({ setScheduleData }) => {
  const [startScheduledDate, setStartScheduledDate] = useState(new Date());
  const [endScheduledDate, setEndScheduledDate] = useState(new Date());
  const [repeatType, setRepeatType] = useState("Once"); // Default repeat type
  const [selectedDay, setSelectedDay] = useState("Sunday");
  const [scheduleHour, setScheduleHour] = useState("01");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [scheduleAmPm, setScheduleAmPm] = useState("AM"); // Default day of the week

  useEffect(() => {
    setScheduleData({
      startScheduledDate: formatDate(startScheduledDate),
      endScheduledDate: formatDate(endScheduledDate),
      repeat: repeatType,
      selectedDay: selectedDay,
      scheduleHour: scheduleHour,
      scheduleMinute: scheduleMinute,
      scheduleAmPm: scheduleAmPm,
    });
  }, [
    startScheduledDate,
    endScheduledDate,
    repeatType,
    selectedDay,
    scheduleHour,
    scheduleMinute,
    scheduleAmPm,
    setScheduleData,
  ]);
  // Format date function to return 'YYYY-MM-DD' format
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: String(i + 1).padStart(2, "0"),
  }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: String(i).padStart(2, "0"),
    label: String(i).padStart(2, "0"),
  }));
  const amPm = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  // Handle changes in start and end date
  const handleDateChange = (type, date) => {
    if (type === "startScheduledDate") {
      setStartScheduledDate(date);
    } else if (type === "endScheduledDate") {
      setEndScheduledDate(date);
    }
  };

  // Options for the Repeat dropdown
  const repeatOptions = [
    { value: "Once", label: "Once" },
    { value: "Weekly", label: "Weekly" },
    { value: "Everyday", label: "Everyday" },
  ];

  const customStyles = {
    control: (base) => ({
      ...base,
      width: "110px", // Set width of the select box
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

  const daysOfWeekOptions = [
    { value: "Sunday", label: "Sunday" },
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
  ];

  return (
    <div className="w-[785px] bg-white shadow-md rounded-md font-montserrat pl-2 pt-3 pb-1 mt-10">
      {/* Date Section */}
      <div className="flex mb-8 gap-4">
        <div className="form-group flex items-center gap-2">
          <label
            className="label text-sm mr-2 mt-4"
            htmlFor="start-scheduled-date"
          >
            Schedule Date (YYYY-MM-DD):
          </label>
          <DatePicker
            id="start-date"
            className="react-datepicker-wrapper p-0 w-full"
            selected={startScheduledDate}
            onChange={(date) => handleDateChange("startScheduledDate", date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            maxDate={endScheduledDate}
          />
          <span className="mt-4">to</span>
          <DatePicker
            id="end-date"
            className="react-datepicker-wrapper p-0 w-full"
            selected={endScheduledDate}
            onChange={(date) => handleDateChange("endScheduledDate", date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            minDate={startScheduledDate}
          />
        </div>
      </div>

      {/* Repeat Section */}
      <div className="flex mb-8 gap-4">
        <div className="form-group flex items-center gap-2">
          <label className="label text-sm mr-2 " htmlFor="repeat">
            Repeat:
          </label>
          <div className="flex gap-2 items-center">
            <Select
              styles={customStyles}
              value={repeatOptions.find(
                (option) => option.value === repeatType
              )}
              onChange={(option) => setRepeatType(option.value)}
              options={repeatOptions}
            />
          </div>
        </div>
        <label className="label text-sm mr-2 " htmlFor="repeat">
          Every:
        </label>
        <div className="flex gap-2 items-center">
          <Select
            styles={customStyles}
            value={daysOfWeekOptions.find(
              (option) => option.value === selectedDay
            )}
            onChange={(option) => setSelectedDay(option.value)}
            options={daysOfWeekOptions}
          />
        </div>
      </div>

      {/* Schedule Time Section */}
      <div className="flex items-center gap-4 mb-4 flex-nowrap">
        <div className="flex gap-2 items-center">
          <label className="block text-sm text-[13px] text-black mb-1 mr-4">
            Schedule Time (HH:MM AM/PM):
          </label>
          <div className="flex items-center space-x-2 font-montserrat">
            <Select
              styles={customStyles}
              value={hours.find((option) => option.value === scheduleHour)}
              onChange={(option) => setScheduleHour(option.value)}
              options={hours}
            />
            <Select
              styles={customStyles}
              value={minutes.find((option) => option.value === scheduleMinute)}
              onChange={(option) => setScheduleMinute(option.value)}
              options={minutes}
            />
            <Select
              styles={customStyles}
              value={amPm.find((option) => option.value === scheduleAmPm)}
              onChange={(option) => setScheduleAmPm(option.value)}
              options={amPm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWidget;
