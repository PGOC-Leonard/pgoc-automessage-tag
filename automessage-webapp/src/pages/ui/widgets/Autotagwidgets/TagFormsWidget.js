import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import "./TagFormsWidget.css";

const TagFormsWidget = ({ setFormData }) => {

  // Get today's date minus 4 days
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 4);

  // Set the default value for maximum workers to 3
  const defaultMaxWorkers = 1;
  const defaultIteration = 100;

  const [formValues, setFormValues] = useState({
    pageId: "",
    accessToken: "",
    TagId: "Inquiry",
    number_of_iteration:defaultIteration ,
    maxWorkers: defaultMaxWorkers, // Default value for max workers

  });

  useEffect(()=>{
    setFormData({
    pageId: formValues.pageId,
    accessToken: formValues.accessToken,
    TagId: formValues.TagId,
    number_of_iteration:formValues.number_of_iteration,
    maxWorkers: formValues.maxWorkers,
    });
  },[setFormData]);


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

  const handleIterationInput = (e) => {
    const value = e.target.value;
  
    // Allow only numeric values and restrict to 1-100
    if (value === "" || /^[1-9]$|^[1-9][0-9]$|^100$/.test(value)) {
      handleChange("number_of_iteration", value);
    } else {
      e.preventDefault(); // Prevent entering any value other than numbers 1-100
    }
  };
  

  return (
    <div className="widget-container grid grid-cols-2 gap-4 ">
      {/* Labels Column */}
      <div className="flex flex-col space-y-2 ml-2">
        <div className="form-group flex items-center h-10">
          <label className="label">Page ID:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label">Access Token:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label">Tag ID Name:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label">Number of Iterations:</label>
        </div>
        <div className="form-group flex items-center h-10">
          <label className="label">Maximum Workers:</label>
        </div>
        
      </div>

      {/* Inputs Column */}
      <div className="flex flex-col space-y-0 p-0 ml-2 mr-2">
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
        <div style={{ height: "1px" }}></div>
        <div className="form-group p-0">
          <input
            className="input-text p-1"
            type="text"
            placeholder="Enter Tag ID Name"
            value={formValues.TagId}
            onChange={(e) => handleChange("TagId", e.target.value)}
          />
        </div>
        <div style={{ height: "6px" }}></div>
        <div className="form-group p-0">
          <input
            className="input-number p-1"
            type="number" // Use number input type to get up and down buttons by default
            min="1" // Set the minimum value
            max="100" // Set the maximum value
            placeholder="Enter Iterations"
            value={formValues.number_of_iteration}
            onChange={handleIterationInput}
          />
        </div>
        <div style={{ height: "8px" }}></div>
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
        
      </div>
    </div>
  );
};

export default TagFormsWidget;
