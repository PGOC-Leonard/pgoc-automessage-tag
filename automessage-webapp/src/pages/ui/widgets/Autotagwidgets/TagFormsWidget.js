import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import "./TagFormsWidget.css";

// Assuming the fetchTagList function is in another file
import { fetchTagList } from "../../../../services/AutoTagFunctions"; // Adjust the import path accordingly

const TagFormsWidget = ({ setFormData }) => {
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 4);

  const defaultMaxWorkers = 1;
  const defaultIteration = 100;

  const [formValues, setFormValues] = useState({
    pageId: "",
    accessToken: "",
    TagId: "",
    number_of_iteration: defaultIteration,
    maxWorkers: defaultMaxWorkers,
  });

  const [tagOptions, setTagOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formValues.pageId && formValues.accessToken) {
      // Fetch tag list when pageId and accessToken are available
      const fetchTags = async () => {
        setLoading(true);
        setError(null); // Reset error before making a new request

        try {
          const data = await fetchTagList(
            formValues.pageId,
            formValues.accessToken
          );
          setTagOptions(data.tag_texts); // Set the fetched tag options
        } catch (err) {
          setError("Error fetching tag list. Please try again.");
          console.error("Error fetching tags:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchTags();
    }
  }, [formValues.pageId, formValues.accessToken]); // Trigger when pageId or accessToken changes

  const handleChange = (field, value) => {
    let updatedValues = { ...formValues, [field]: value };

    setFormValues(updatedValues);
    setFormData({
      ...updatedValues,
    });
  };

  const handleMaxWorkersInput = (e) => {
    const value = e.target.value;

    if (
      value === "" ||
      (["1", "2", "3"].includes(value) && value.length === 1)
    ) {
      handleChange("maxWorkers", value);
    } else {
      e.preventDefault();
    }
  };

  const handleIterationInput = (e) => {
    const value = e.target.value;

    if (value === "" || /^[1-9]$|^[1-9][0-9]$|^100$/.test(value)) {
      handleChange("number_of_iteration", value);
    } else {
      e.preventDefault();
    }
  };

  return (
    <div className="widget-container grid grid-cols-2 gap-4">
      {/* Labels Column */}
      <div className="flex flex-col space-y-2 ml-2">
        <div className="form-group flex items-center h-10 mt-1">
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
        <div style={{ height: "2px" }}></div>
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
        <div style={{ height: "14px" }}></div>
        <div className="form-group p-0">
          <Autocomplete
            freeSolo
            options={tagOptions}
            value={formValues.TagId || ""} // Ensure value is always a string
            disableClearable
            disabled={!formValues.pageId || !formValues.accessToken}
            onInputChange={(event, newInputValue) => {
              // Update the formValues.TagId when manually typing
              handleChange("TagId", newInputValue);
            }}
            onChange={(event, newValue) => {
              // Update the formValues.TagId when selecting from dropdown
              handleChange("TagId", newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Enter or Select Tag ID"
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "12px",
                    borderRadius: "var(--border-radius)",
                    backgroundColor:
                      !formValues.pageId || !formValues.accessToken
                        ? "#f0f0f0"
                        : "var(--input-background)",
                    height: "28px",
                    padding: "1px",
                    "&.Mui-focused fieldset": {
                      borderColor: "#a40404", // Focus border color
                      borderWidth: "1px",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "var(--text-color)",
                  },
                }}
              />
            )}
          />
        </div>

        <div style={{ height: "12px" }}></div>
        <div className="form-group p-0">
          <input
            className="input-number p-1"
            type="number"
            min="1"
            max="100"
            placeholder="Enter Iterations"
            value={formValues.number_of_iteration}
            onChange={handleIterationInput}
          />
        </div>
        <div style={{ height: "8px" }}></div>
        <div className="form-group p-0">
          <input
            className="input-number p-1"
            type="number"
            min="1"
            max="3"
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
