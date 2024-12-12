import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

const MessageWidget = ({ setMessageData }) => {
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

  const [messageBatches, setMessageBatches] = useState(() => {
    const savedBatches = localStorage.getItem("messageBatches");
    return savedBatches
      ? JSON.parse(savedBatches)
      : [
          {
            message_title: "",
            text_message: "",
            schedule_date: new Date().toISOString().split("T")[0],
            schedule_hour: "01",
            schedule_minute: "00",
            schedule_ampm: "AM",
          },
        ];
  });

  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    localStorage.setItem("messageBatches", JSON.stringify(messageBatches));
    setMessageData(messageBatches); // Update parent state when messageBatches changes
  }, [messageBatches, setMessageData]);

  const handleInputChange = (index, event) => {
    const { name, value } = event.target || event;
    const updatedBatches = [...messageBatches];
    updatedBatches[index][name] = value;
    setMessageBatches(updatedBatches);
  };

  const addInputFields = () => {
    if (messageBatches.length < 24) {
      const newBatch = {
        message_title: "",
        text_message: "",
        schedule_date: new Date().toISOString().split("T")[0],
        schedule_hour: "01",
        schedule_minute: "00",
        schedule_ampm: "AM",
      };
      const updatedBatches = [newBatch, ...messageBatches];
      setMessageBatches(updatedBatches);
      setLimitReached(false);
    } else {
      setLimitReached(true);
    }
  };

  const removeInputFields = (index) => {
    const updatedBatches = messageBatches.filter((_, i) => i !== index);
    setMessageBatches(updatedBatches);
    setLimitReached(false);
  };

  return (
    <div className="w-[500px] bg-white p-4 rounded-lg shadow-md h-[425px] font-montserrat ">
      <div className="flex justify-between items-center mb-4">
        <h1 className="flex-grow text-[16px] leading-[1.2] text-[#A44444] text-left pt-1">
          Message:
        </h1>
        <button
          onClick={addInputFields}
          className="bg-gray-500 text-white py-1 px-2 rounded-md hover:bg-gray-600 flex items-center"
        >
          <AddIcon className="mr-1" /> 
          Add Message
        </button>
      </div>
      {limitReached && (
        <div className="mb-4 text-red-500 text-sm">
          <p>You can only add up to 24 messages.</p>
        </div>
      )}
      <div className="bg-gray-100 p-4 rounded-md shadow-sm mb-4 w-full h-[350px] overflow-y-auto">
        {messageBatches.length === 0 ? (
          <p className="text-center text-gray-500">No messages added yet.</p>
        ) : (
          messageBatches.map((batch, index) => (
            <div
              key={index}
              className="bg-white p-2 rounded-md shadow-sm mb-4 w-full border border-black"
            >
              <div className="mb-2">
                <label className="label">Message title:</label>
                <input
                  type="text"
                  name="message_title"
                  value={batch.message_title}
                  onChange={(e) => handleInputChange(index, e)}
                  className="mt-1 p-2 w-full border bg-[#E1E1E1] border-gray-600 rounded-md text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[#d32f2f] font-montserrat"
                />
              </div>
              <div className="mb-2">
                <label className="label">Message:</label>
                <textarea
                  name="text_message"
                  value={batch.text_message}
                  onChange={(e) => handleInputChange(index, e)}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[#d32f2f] h-20 font-montserrat resize-none"
                />
              </div>
              <div className="mb-2">
                <div>
                  <label className="block text-sm text-[13px] text-black mb-1">
                    Date (MM-DD-YYYY):
                  </label>
                  <DatePicker
                    selected={
                      batch.schedule_date
                        ? new Date(batch.schedule_date)
                        : new Date()
                    } // Ensure valid default value
                    onChange={(date) =>
                      handleInputChange(index, {
                        target: {
                          name: "schedule_date",
                          value: date.toISOString().split("T")[0],
                        },
                      })
                    }
                    dateFormat="MM-dd-yyyy"
                    className="text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d32f2f] h-8 w-[120px] font-montserrat"
                  />
                </div>
                <div style={{ height: "10px" }}></div>
                <div>
                  <label className="block text-sm text-[13px] text-black mb-1">
                    Time (HH:MM AM/PM):
                  </label>
                  <div className="flex items-center space-x-2 font-montserrat">
                    <Select
                      menuPlacement="top"
                      styles={customStyles}
                      value={{
                        value: batch.schedule_hour,
                        label: batch.schedule_hour,
                      }}
                      onChange={(selectedOption) =>
                        handleInputChange(index, {
                          target: {
                            name: "schedule_hour",
                            value: selectedOption.value,
                          },
                        })
                      }
                      options={hours}
                      isSearchable={false}
                    />
                    <Select
                      menuPlacement="top"
                      styles={customStyles}
                      value={{
                        value: batch.schedule_minute,
                        label: batch.schedule_minute,
                      }}
                      onChange={(selectedOption) =>
                        handleInputChange(index, {
                          target: {
                            name: "schedule_minute",
                            value: selectedOption.value,
                          },
                        })
                      }
                      options={minutes}
                      isSearchable={false}
                    />
                    <Select
                      menuPlacement="top"
                      styles={customStyles}
                      value={{
                        value: batch.schedule_ampm,
                        label: batch.schedule_ampm,
                      }}
                      onChange={(selectedOption) =>
                        handleInputChange(index, {
                          target: {
                            name: "schedule_ampm",
                            value: selectedOption.value,
                          },
                        })
                      }
                      options={amPm}
                      isSearchable={false}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => removeInputFields(index)}
                  className="bg-[#A70000] text-white py-1 px-2 rounded-md hover:bg-[#8A0000] font-montserrat text-[10px]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageWidget;
