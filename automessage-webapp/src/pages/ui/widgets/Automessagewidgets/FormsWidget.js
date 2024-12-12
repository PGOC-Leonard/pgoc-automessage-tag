import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./FormsWidget.css";

const FormsWidget = ({ setFormData }) => {
  // Get today's date and subtract 4 days
  const today = new Date();

  // Get today's date minus 4 days
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 4);

  // Set the default value for maximum workers to 3
  const defaultMaxWorkers = 3;

  const [formValues, setFormValues] = useState({
    pageId: "",
    accessToken: "",
    maxWorkers: defaultMaxWorkers, // Default value for max workers
    startDate: defaultStartDate, // Initialize with default start date
    endDate: today, // Initialize with today's date as the default end date
  });

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleChange = (field, value) => {
    let updatedValues = { ...formValues, [field]: value };

    // Ensure `startDate` is always at least 4 days before `endDate`
    if (field === "endDate" && value) {
      const startDateThreshold = new Date(value);
      startDateThreshold.setDate(startDateThreshold.getDate() - 4);

      // Automatically adjust `startDate` if it's null or too late
      if (
        !updatedValues.startDate ||
        new Date(updatedValues.startDate) > startDateThreshold
      ) {
        updatedValues.startDate = startDateThreshold;
      }
    }

    setFormValues(updatedValues);

    // Immediately update parent component with formatted data
    setFormData({
      ...updatedValues,
      startDate: formatDate(updatedValues.startDate),
      endDate: formatDate(updatedValues.endDate),
    });
  };

  const handleMaxWorkersInput = (e) => {
    const value = e.target.value;

    // Allow only '1', '2', or '3' and restrict more than one digit
    if (value === "" || ["1", "2", "3"].includes(value) && value.length === 1) {
      handleChange("maxWorkers", value);
    } else {
      e.preventDefault(); // Prevent entering any value other than '1', '2', or '3'
    }
  };

  return (
    <div className="widget-container grid grid-cols-2 gap-4 ">
      {/* Labels Column */}
      <div className="flex flex-col space-y-2">
        <div className="form-group flex items-center h-10">
          <label className="label">Page ID:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label">Access Token:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label">Maximum Workers:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label" htmlFor="start-date">
            Conversations Start Date (YYYY-MM-DD):
          </label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label" htmlFor="end-date">
            Conversations End Date (YYYY-MM-DD):
          </label>
        </div>
      </div>

      {/* Inputs Column */}
      <div className="flex flex-col space-y-0 p-0">
        <div className="form-group p-0">
          <input
            className="input-text p-1"
            type="text"
            placeholder="Enter Page ID"
            value={formValues.pageId}
            onChange={(e) => handleChange("pageId", e.target.value)}
          />
        </div>
        <div style={{ height: "1px" }}></div>
        <div className="form-group p-0">
          <input
            className="input-text p-1"
            type="text"
            placeholder="Enter Access Token"
            value={formValues.accessToken}
            onChange={(e) => handleChange("accessToken", e.target.value)}
          />
        </div>
        <div style={{ height: "4px" }}></div>
        <div className="form-group p-0">
          <input
            className="input-number p-1"
            type="number" // Use number input type to get up and down buttons by default
            min="1" // Set the minimum value
            max="3" // Set the maximum value
            placeholder="Enter Maximum Workers"
            value={formValues.maxWorkers}
            onChange={handleMaxWorkersInput}
          />
        </div>
        <div style={{ height: "3px" }}></div>
        <div className="form-group p-0">
          <DatePicker
            id="start-date"
            className="react-datepicker-wrapper p-0"
            selected={formValues.startDate}
            onChange={(date) => handleChange("startDate", date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
            maxDate={formValues.endDate ? new Date(formValues.endDate) : null}
          />
        </div>
        <div style={{ height: "12px" }}></div>
        <div className="form-group p-0">
          <DatePicker
            id="end-date"
            className="react-datepicker-wrapper p-0"
            selected={formValues.endDate}
            onChange={(date) => handleChange("endDate", date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-mm-dd"
          />
        </div>
      </div>
    </div>
  );
};

export default FormsWidget;
