import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./TagFormsWidget.css";
import Select from "react-select";

const EditDialogTag = ({
  isOpen,
  onClose,
  selectedData,
  onSave,
  selectedIndex,
}) => {
  const today = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 4);

  const daysOfWeekOptions = [
    { value: "Sunday", label: "Sunday" },
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
  ];

  const repeatOptions = [
    { value: "Once", label: "Once" },
    { value: "Weekly", label: "Weekly" },
    { value: "Everyday", label: "Everyday" },
  ];

  // Initialize formValues based on selectedData directly when the dialog is shown
  const initialFormValues = selectedData
    ? {
        page_id: selectedData.page_id || "",
        access_token: selectedData.access_token || "",
        max_workers: selectedData.max_workers || 3,
        tag_id_name: selectedData.tag_id_name,
        start_date: selectedData.start_date || defaultStartDate,
        status: selectedData.status,
        end_date: selectedData.end_date || today,
        schedule_date: selectedData.schedule_date,
        schedule_enddate: selectedData.schedule_enddate,
        schedule_time: selectedData.schedule_time,
        schedule_hour: selectedData.schedule_hour, // Default to empty
        schedule_minute: selectedData.schedule_minute, // Default to empty
        schedule_ampm: selectedData.schedule_ampm, // Default to empty
        start_hour: selectedData.start_time
          ? selectedData.start_time.split(":")[0]
          : "00",
        start_minute: selectedData.start_time
          ? selectedData.start_time.split(":")[1]
          : "00",
        start_second: selectedData.start_time
          ? selectedData.start_time.split(":")[2]
          : "00",
        end_hour: selectedData.end_time
          ? selectedData.end_time.split(":")[0]
          : "23",
        end_minute: selectedData.end_time
          ? selectedData.end_time.split(":")[1]
          : "59",
        end_second: selectedData.end_time
          ? selectedData.end_time.split(":")[2]
          : "59",
        schedule_pattern: selectedData.schedule_pattern,
        schedule_weekly: selectedData.schedule_weekly,
      }
    : {};

  const extractTimeComponents = (schedule_time) => {
    const [time, amPm] = schedule_time.split(" "); // Split the time and AM/PM
    const [hour, minute] = time.split(":"); // Split the hour and minute
    return {
      schedule_hour: hour.padStart(2, "0"), // Ensure two digits for hour
      schedule_minute: minute.padStart(2, "0"), // Ensure two digits for minute
      schedule_ampm: amPm.toUpperCase(), // Capitalize AM/PM
    };
  };

  const [formValues, setFormValues] = useState(() => {
    const extractedTime = selectedData?.schedule_time
      ? extractTimeComponents(selectedData.schedule_time)
      : { schedule_hour: "00", schedule_minute: "00", schedule_ampm: "AM" };

    return {
      ...initialFormValues,
      ...extractedTime, // Add extracted time components to formValues
    };
  });

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString().padStart(2, "0"),
    label: i.toString().padStart(2, "0"),
  }));

  const schedule_hours = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"), // 01 to 12 for the value
    label: (i + 1).toString().padStart(2, "0"), // 01 to 12 for the label
  }));
  const minutesSeconds = Array.from({ length: 60 }, (_, i) => ({
    value: i.toString().padStart(2, "0"),
    label: i.toString().padStart(2, "0"),
  }));

  const amPm = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  const customStyles = {
    control: (base) => ({
      ...base,
      width: "80px",
      height: "24px",
      fontSize: "12px",
      padding: "0px",
      margin: "0px",
      fontFamily: "Montserrat, sans-serif",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      fontSize: "8px",
      color: "red",
      padding: "2px",
      margin: "0px",
    }),
    indicatorSeparator: (base) => ({
      display: "none",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333",
      paddingRight: "2px",
      fontFamily: "Montserrat, sans-serif",
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "12px",
      fontFamily: "Montserrat, sans-serif",
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: "150px",
      overflowY: "auto",
      fontFamily: "Montserrat, sans-serif",
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? "red" : "black",
      backgroundColor: state.isFocused ? "#DDB8B8" : "transparent",
      fontFamily: "Montserrat, sans-serif",
    }),
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (field, value) => {
    // Update the field value first
    setFormValues((prevValues) => {
      const newValues = { ...prevValues, [field]: value };

      // If the field is one of the schedule components, combine them into scheduledTime
      if (
        field === "schedule_hour" ||
        field === "schedule_minute" ||
        field === "schedule_ampm"
      ) {
        const schedule_time = `${newValues.schedule_hour}:${newValues.schedule_minute} ${newValues.schedule_ampm}`;
        return { ...newValues, schedule_time }; // Update combined time value
      }

      // For message_title and message_body, just update their respective values
      if (field === "message_title" || field === "message_body") {
        return newValues; // Return new state with updated message title/body
      }

      return newValues;
    });
  };

  const handleChange = (field, value) => {
    setFormValues({ ...formValues, [field]: value });
  };

  const handleTimeChange = (field, value) => {
    setFormValues((prevState) => ({
      ...prevState,
      [field]: value.value,
    }));
  };

  const handleSave = () => {
    const start_time = `${formValues.start_hour}:${formValues.start_minute}:${formValues.start_second}`;
    const end_time = `${formValues.end_hour}:${formValues.end_minute}:${formValues.end_second}`;

    const updated_data = {
        ...selectedData,
        page_id:
          formValues.page_id !== selectedData.page_id
            ? formValues.page_id
            : selectedData.page_id,
        access_token:
          formValues.access_token !== selectedData.access_token
            ? formValues.access_token
            : selectedData.access_token,
        max_workers:
          formValues.max_worker !== selectedData.max_workers
            ? formValues.max_workers
            : selectedData.max_workers,
        start_date:
          formValues.start_date !== selectedData.start_date
            ? formatDate(formValues.start_date)
            : selectedData.start_date,
        end_date:
          formValues.end_date !== selectedData.end_date
            ? formatDate(formValues.end_date)
            : selectedData.end_date,
        start_time:
          formValues.start_time !== selectedData.start_time
            ? start_time
            : selectedData.start_time,
        end_time:
          formValues.end_time !== selectedData.end_time
            ? end_time
            : selectedData.end_time,
        schedule_hour:
          formValues.schedule_hour !== selectedData.schedule_hour
            ? formValues.schedule_hour
            : selectedData.schedule_hour,
        schedule_minute:
          formValues.schedule_minute !== selectedData.schedule_minute
            ? formValues.schedule_minute
            : selectedData.schedule_minute,
        schedule_ampm:
          formValues.schedule_ampm !== selectedData.schedule_ampm
            ? formValues.schedule_ampm
            : selectedData.schedule_ampm,
        schedule_time:
          formValues.schedule_time !== selectedData.schedule_time
            ? formValues.schedule_time
            : selectedData.schedule_time,
        schedule_date:
          formValues.schedule_date !== selectedData.schedule_date
            ? formatDate(formValues.schedule_date)
            : selectedData.schedule_date,
        schedule_enddate:
          formValues.schedule_enddate !== selectedData.schedule_enddate
            ? formatDate(formValues.schedule_enddate)
            : selectedData.schedule_enddate,
        schedule_pattern:
          formValues.schedule_pattern !== selectedData.schedule_pattern
            ? formValues.schedule_pattern
            : selectedData.schedule_pattern,
        schedule_weekly:
          formValues.schedule_weekly !== selectedData.schedule_weekly
            ? formValues.schedule_weekly
            : selectedData.schedule_weekly,
      
    };
    // console.log(updated_data);
    onSave(updated_data);
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 pb-10 z-50">
      <div className="dialog-container bg-[#E1E1E1] rounded-lg shadow-lg w-[550px] h-[85vh] overflow-x-auto p-6 flex flex-col items-center">
        <h2 className="text-2xl font-montserrat text-[26px] mb-4">
          Edit Schedule
        </h2>
        <div className="widget-container grid grid-cols-2 gap-4 w-full">
          {/* Labels */}
          <div className="flex flex-col space-y-3">
            <div style={{ height: "4px" }}></div>
            <label className="label-edit">Page ID:</label>
            <div style={{ height: "0px" }}></div>
            <label className="label-edit">Access Token:</label>
            <label className="label-edit">Tag ID Name:</label>
            <label className="label-edit">Maximum Workers:</label>
            <div style={{ height: "0px" }}></div>
            <label className="label-edit">Start Date:</label>
            <label className="label-edit">End Date:</label>
            <div style={{ height: "4px" }}></div>
            <label className="label-edit">Start Time:</label>
            <div style={{ height: "5px" }}></div>
            <label className="label-edit">End Time:</label>
            <div style={{ height: "1px" }}></div>
          </div>

          {/* Inputs */}
          <div className="flex flex-col space-y-2">
            <input
              className="input-text"
              type="text"
              placeholder="Enter Page ID"
              value={formValues.page_id}
              onChange={(e) => handleChange("page_id", e.target.value)}
            />
            <input
              className="input-text"
              type="text"
              placeholder="Enter Access Token"
              value={formValues.access_token}
              onChange={(e) => handleChange("access_token", e.target.value)}
            />
            <input
              className="input-text"
              type="text"
              placeholder="Enter Tag Id Name"
              value={formValues.tag_id_name}
              onChange={(e) => handleChange("tag_id_name", e.target.value)}
            />
            <input
              className="input-number"
              type="number"
              min="1"
              max="3"
              placeholder="Enter Maximum Workers"
              value={formValues.max_workers}
              onChange={(e) => handleChange("max_workers", e.target.value)}
            />
            <DatePicker
              selected={formValues.start_date}
              onChange={(date) => handleChange("start_date", date)}
              dateFormat="yyyy-MM-dd"
            />
            <DatePicker
              selected={formValues.end_date}
              onChange={(date) => handleChange("end_date", date)}
              dateFormat="yyyy-MM-dd"
            />
            <div></div>
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col">
                <div className="flex space-x-2 mt-2">
                  <Select
                    styles={customStyles}
                    value={{
                      value: formValues.start_hour,
                      label: formValues.start_hour,
                    }}
                    onChange={(value) => handleTimeChange("start_hour", value)}
                    options={hours}
                  />
                  <Select
                    styles={customStyles}
                    value={{
                      value: formValues.start_minute,
                      label: formValues.start_minute,
                    }}
                    onChange={(value) =>
                      handleTimeChange("start_minute", value)
                    }
                    options={minutesSeconds}
                  />
                  <Select
                    styles={customStyles}
                    value={{
                      value: formValues.start_second,
                      label: formValues.start_second,
                    }}
                    onChange={(value) =>
                      handleTimeChange("start_second", value)
                    }
                    options={minutesSeconds}
                  />
                </div>
              </div>

              <div className="flex flex-col mt-4">
                <div className="flex space-x-2 mt-2">
                  <Select
                    styles={customStyles}
                    value={{
                      value: formValues.end_hour,
                      label: formValues.end_hour,
                    }}
                    onChange={(value) => handleTimeChange("end_hour", value)}
                    options={hours}
                  />
                  <Select
                    styles={customStyles}
                    value={{
                      value: formValues.end_minute,
                      label: formValues.end_minute,
                    }}
                    onChange={(value) => handleTimeChange("end_minute", value)}
                    options={minutesSeconds}
                  />
                  <Select
                    styles={customStyles}
                    value={{
                      value: formValues.end_second,
                      label: formValues.end_second,
                    }}
                    onChange={(value) => handleTimeChange("end_second", value)}
                    options={minutesSeconds}
                  />
                </div>
              </div>

              {/* Radio buttons for message method */}
              <div style={{ height: "1px" }}></div>
              <div className="flex items-center"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 w-[495px] mx-auto mt-5">
          <div className="flex flex-col items-center justify-center">
            <label
              className="label text-sm mr-2 mt-4"
              htmlFor="start-scheduled-date"
            >
              Schedule Date (YYYY-MM-DD):
            </label>
            <div className="flex mb-8 gap-4">
              <div className="form-group flex items-center gap-2">
                <DatePicker
                  placeholderText="yyyy-mm-dd"
                  maxDate={formValues.schedule_enddate}
                  selected={formValues.schedule_date}
                  onChange={(date) => handleChange("schedule_date", date)}
                  dateFormat="yyyy-MM-dd"
                />
                <span className="mt-4">to</span>
                <DatePicker
                  selected={formValues.schedule_enddate}
                  onChange={(date) => handleChange("schedule_enddate", date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="yyyy-mm-dd"
                  minDate={formValues.schedule_date}
                />
              </div>
            </div>

            <label className="block text-[13px] text-black mb-4">
              Time (HH:MM AM/PM):
            </label>
            <div>
              <div className="flex items-center space-x-2 font-montserrat mb-6">
                <Select
                  menuPlacement="top"
                  styles={customStyles}
                  value={{
                    value: formValues.schedule_hour,
                    label: formValues.schedule_hour,
                  }}
                  onChange={
                    (selectedOption) =>
                      handleInputChange("schedule_hour", selectedOption.value) // Directly pass the field name and value
                  }
                  options={schedule_hours}
                  isSearchable={false}
                />

                <Select
                  menuPlacement="top"
                  styles={customStyles}
                  value={{
                    value: formValues.schedule_minute,
                    label: formValues.schedule_minute,
                  }}
                  onChange={
                    (selectedOption) =>
                      handleInputChange("schedule_minute", selectedOption.value) // Directly pass the field name and value
                  }
                  options={minutesSeconds}
                  isSearchable={false}
                />

                <Select
                  menuPlacement="top"
                  styles={customStyles}
                  value={{
                    value: formValues.schedule_ampm,
                    label: formValues.schedule_ampm,
                  }}
                  onChange={
                    (selectedOption) =>
                      handleInputChange("schedule_ampm", selectedOption.value) // Directly pass the field name and value
                  }
                  options={amPm}
                  isSearchable={false}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
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
                        (option) => option.value === formValues.schedule_pattern
                      )}
                      onChange={(option) =>
                        handleChange("schedule_pattern", option.value)
                      }
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
                      (option) => option.value === formValues.schedule_weekly
                    )}
                    onChange={(option) =>
                      handleChange("schedule_weekly", option.value)
                    }
                    options={daysOfWeekOptions}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <button
            className="bg-gray-500 text-white py-1 px-2 rounded-md hover:bg-gray-600"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="bg-[#A70000] text-white py-1 px-2 rounded-md hover:bg-[#8A0000]"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
export default EditDialogTag;
