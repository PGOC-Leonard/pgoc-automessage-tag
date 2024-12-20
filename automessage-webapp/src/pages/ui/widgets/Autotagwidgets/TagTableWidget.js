import React, { useState, useEffect } from "react";
import notify from "../../../components/Toast";
import DownloadIcon from "@mui/icons-material/Download";
import StopIcon from "@mui/icons-material/Stop";
import EditIcon from "@mui/icons-material/Edit";
import {
  stop_ScheduleTag,
  updateTagData,
} from "../../../../services/AutoTagFunctions";
import EditDialogTag from "./EditTagWidget";
import LinearProgress from "@mui/material/LinearProgress";

function TagTableWidget({
  tagtableData,
  setTableData,
  fetchInitialData,
  addmessage,
  handleSelectIndex,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const handleClickRowIndex = (index) => {
    setSelectedIndex(index);
    handleSelectIndex(index);
  };

  // useEffect(() => {
  //   // Reset selectedIndex whenever tableData is updated
  //   setSelectedIndex(null);
  // }, [fetchInitialData]);

  const stopSchedule = async () => {
    if (selectedIndex !== null) {
      const selectedData = tagtableData[selectedIndex];
      const taskId = selectedData?.task_id_schedule; // Access task_id from selected row data
      const status = selectedData?.status;
      const Batch = selectedData?.Batch; // Access status from selected row data // Access status from selected row data

      if (status === "Scheduled") {
        try {
          // Call the API to stop the schedule
          const response = await stop_ScheduleTag(taskId);
          console.log(response);

          if (
            response.status === "SUCCESS" ||
            response.result === "Task stopped" ||
            response.status === "ABORTED"
          ) {
            // await fetchInitialData();
            notify(`Schedule stopped successfully`, "success");
            addmessage(`Schedule stopped successfully ${taskId} for ${Batch}`);
            // Refresh table data
          } else if (response.error) {
            notify(`Failed to stop schedule: ${response.error}`, "error");
            addmessage(`Failed to stop schedule: ${response.error}`);
          }
        } catch (error) {
          notify(`An error occurred: ${error.message}`, "error");
          addmessage(`Error stopping schedule: ${error}`);
        }
      } else {
        notify("Only Scheduled Task are allowed to be stopped.", "error");
      }
    } else {
      notify("No Task selected. Please select a message to stop.", "info");
    }
  };

  const stopTagging = async () => {
    if (selectedIndex !== null) {
      const selectedData = tagtableData[selectedIndex];
      const taskId = selectedData?.task_id; // Access task_id from selected row data
      const status = selectedData?.status;
      const Batch = selectedData?.Batch; // Access status from selected row data

      if (status === "Ongoing") {
        try {
          // Call the API to stop the schedule
          const response = await stop_ScheduleTag(taskId);
          console.log(response);

          if (
            response.status === "SUCCESS" ||
            response.result === "Task stopped" ||
            response.status === "ABORTED"
          ) {
            // await fetchInitialData();
            notify(`Schedule stopped successfully`, "success");
            addmessage(`Task stopped successfully ${taskId} for ${Batch}`);
            // Refresh table data
          } else if (response.error) {
            notify(`Failed to stop schedule: ${response.error}`, "error");
            addmessage(`Failed to stop Task: ${response.error}`);
          }
        } catch (error) {
          notify(`An error occurred: ${error.message}`, "error");
          addmessage(`Error stopping schedule: ${error}`);
        }
      } else {
        notify("Only Ongoing Task are allowed to be stopped.", "error");
      }
    } else {
      notify("No task selected", "info");
    }
  };

  const handleEdit = () => {
    if (selectedIndex !== null) {
      const selectedData = tagtableData[selectedIndex];
      const status = selectedData?.status;

      if (status === "Scheduled") {
        setIsDialogOpen(true);
      } else {
        notify("Only Scheduled messages are allowed to be edited.", "error");
      }
    } else {
      notify("No message selected. Please select a message to edit.", "info");
    }
  };

  const handleDialogSave = async (updatedData) => {
    console.log(updatedData);
    try {
      // Destructure the updatedData to get the index and the edited_schedule_data
      const edited_schedule_data = updatedData;
      // Ensure we are updating the correct index
      const response = await updateTagData(edited_schedule_data);

      if (response && response.status === 200) {
        console.log("Data updated successfully", response.data);
        fetchInitialData(); // Refresh the table data
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to update schedule data:", error.message);
    }
  };

  return (
    <div className="w-100 h-[400px] -mt-4 font-montserrat text-[12px]">
      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mb-2">
        <button
          onClick={() => selectedIndex !== null && handleEdit()}
          className="bg-gray-500 text-white py-1 px-2 rounded-md hover:bg-gray-600"
        >
          <EditIcon fontSize="small" className="mr-1" />
          Edit Schedule
        </button>
        <button
          onClick={() => selectedIndex !== null && stopSchedule()}
          className="bg-[#A70000] text-white py-1 px-2 rounded-md hover:bg-[#8A0000]"
        >
          <StopIcon fontSize="small" className="mr-1" />
          Stop Schedule
        </button>
        <button
          onClick={() => selectedIndex !== null && stopTagging()}
          className="bg-[#A70000] text-white py-1 px-2 rounded-md hover:bg-[#8A0000]"
        >
          <StopIcon fontSize="small" className="mr-1" />
          Stop Tagging
        </button>
        <button
          onClick={console.log("download")}
          className="bg-[#46923c] text-white py-1 px-2 rounded-md hover:bg-[#3b8132]"
        >
          <DownloadIcon fontSize="small" className="mr-1" />
          Download
        </button>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto h-[580px] border-2 max-w-[1310px]">
        <table className="min-w-full table-auto border-collapse">
          <thead className="sticky top-0 bg-gray-200 z-10">
            <tr>
              <th className="px-4 py-2 text-center">Page ID</th>
              <th className="px-4 py-2 text-center">Access Token</th>
              <th className="px-4 py-2 text-center">Tag Name</th>
              <th className="px-4 py-2 text-center">Start Date</th>
              <th className="px-4 py-2 text-center">End Date</th>
              <th className="px-4 py-2 text-center">Start Time</th>
              <th className="px-4 py-2 text-center">End Time</th>
              <th className="px-4 py-2 text-center">Scheduled Date</th>
              <th className="px-4 py-2 text-center">Schedule End Date</th>
              <th className="px-4 py-2 text-center">Scheduled Time</th>
              <th className="px-4 py-2 text-center">Batch</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Total Tags</th>
              <th className="px-4 py-2 text-center">Progress</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(tagtableData).map((row, index) => {
              // Default progress to 0 if row.progress is undefined or invalid
              const progress = row.progress ? row.progress : 0;

              // Define progress color and text based on the status
              let progressColor = "#46923c"; // default color
              let progressText = "";

              switch (row.status) {
                case "Failed":
                case "STOPPED":
                  progressColor = "red";
                  progressText = row.status;
                  break;
                case "Success":
                  progressColor = "#279100";
                  progressText = "Success";
                  break;
                case "Ongoing":
                  progressColor = "#f08d4f";
                  progressText = "In Progress";
                  break;
                case "No Conversations":
                  progressColor = "#080404";
                  progressText = "No Conversations";
                  break;
                default:
                  progressColor = "#46923c";
                  progressText = "";
                  break;
              }

              return (
                <tr
                  key={index}
                  className={`border-t ${
                    selectedIndex === index ? "bg-blue-100" : ""
                  }`}
                  onClick={() => handleClickRowIndex(index)}
                  style={
                    index === 0
                      ? { backgroundColor: "rgba(0, 255, 0, 0.3)" }
                      : {}
                  }
                >
                  <td
                    className="px-4 py-2 text-center overflow-hidden whitespace-nowrap text-ellipsis max-w-[100px]"
                    title={row.page_id}
                  >
                    {row.page_id}
                  </td>
                  <td
                    className="px-4 py-2 text-center overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]"
                    title={row.access_token}
                  >
                    {row.access_token}
                  </td>

                  <td className="px-4 py-2 text-center">{row.tag_id_name}</td>
                  <td className="px-4 py-2 text-center">{row.start_date}</td>
                  <td className="px-4 py-2 text-center">{row.end_date}</td>
                  <td className="px-4 py-2 text-center">{row.start_time}</td>
                  <td className="px-4 py-2 text-center">{row.end_time}</td>
                  <td className="px-4 py-2 text-center">{row.schedule_date}</td>
                  <td className="px-4 py-2 text-center">
                    {row.schedule_enddate}
                  </td>
                  <td className="px-4 py-2 text-center">{row.schedule_time}</td>
                  <td className="px-4 py-2 text-center">{row.Batch}</td>
                  <td className="px-4 py-2 text-center">{row.status}</td>
                  <td className="px-4 py-2 text-center">{row.total_tags}</td>
                  <td className="px-4 py-2 text-center ">
                    <LinearProgress
                      variant="determinate"
                      value={progress} // Use the default value of 0 if progress is invalid
                      color="primary"
                      size={15}
                      sx={{
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: progressColor,
                        },
                        backgroundColor: "#e0e0e0",
                      }}
                    />
                    <span
                      className="font-semibold"
                      style={{ color: progressColor }}
                    >
                      {`${progress}%`} {progressText}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isDialogOpen && selectedIndex !== null && (
        <EditDialogTag
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          selectedData={tagtableData[selectedIndex]}
          onSave={handleDialogSave}
          selectedIndex={selectedIndex}
        />
      )}
    </div>
  );
}

export default TagTableWidget;
