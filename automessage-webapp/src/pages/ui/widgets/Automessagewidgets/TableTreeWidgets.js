import React, { useState, useEffect } from "react";
import EditDialogAutoMessage from "./EditDialogAutoMessage";
import { editData, stop_Schedule } from "../../../../services/AutoMessageFunctions";
import notify from "../../../components/Toast";

function TableTreeWidget({ tableData, setTableData, fetchInitialData , addmessage}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelectIndex = (index) => {
    setSelectedIndex(index);
    // Log the selected row data when an index is selected
    console.log(index)
    console.log("Selected row data:", tableData[index]);
  };

  useEffect(() => {
    // Reset selectedIndex whenever tableData is updated
    setSelectedIndex(null);
  }, [fetchInitialData]);
  
  

  const stopSchedule = async () => {
    if (selectedIndex !== null) {
      const selectedData = tableData[selectedIndex];
      const taskId = selectedData?.task_id; // Access task_id from selected row data
      const status = selectedData?.status; // Access status from selected row data
  
      if (status === "Scheduled") {
        try {
          // Call the API to stop the schedule
          const response = await stop_Schedule(taskId);
          // console.log(response);
  
          if (response.status === "SUCCESS" || response.result === "Task stopped" || response.status === "ABORTED" ) {
            // await fetchInitialData();
            notify(`Schedule stopped successfully`, "success");
            addmessage(`Schedule stopped successfully ${taskId}.`)
             // Refresh table data
          } else if (response.error) {
            notify(`Failed to stop schedule: ${response.error}`, "error");
            addmessage(`Failed to stop schedule: ${response.error}`)
          } 
        } catch (error) {
          notify(`An error occurred: ${error.message}`, "error");
          addmessage(`Error stopping schedule: ${error}`);
        }
      } else {
        notify("Only Scheduled messages are allowed to be stopped.", "error");
      }
    } else {
      notify("No message selected. Please select a message to stop.", "info");
    }
  };
  
  

  const handleEdit = () => {
    if (selectedIndex !== null) {
      const selectedData = tableData[selectedIndex];
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
    try {
      // Destructure the updatedData to get the index and the edited_schedule_data
      const edited_schedule_data  = updatedData;
      // Ensure we are updating the correct index
      const response = await editData(edited_schedule_data);

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
    <div className="w-[780px] h-[400px] mt-2 font-montserrat text-[12px] " >
      {/* Action Buttons */}
      <div className="flex justify-start space-x-2 mb-2">
        <button
          onClick={() => selectedIndex !== null && handleEdit()}
          className="bg-gray-500 text-white py-1 px-2 rounded-md hover:bg-gray-600"
        >
          Edit Schedule
        </button>
        <button
          onClick={() => selectedIndex !== null && stopSchedule(selectedIndex)}
          className="bg-[#A70000] text-white py-1 px-2 rounded-md hover:bg-[#8A0000]"
        >
          Stop Schedule
        </button>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto h-[580px] border-2 border-">
        <table className="min-w-full table-auto border-collapse">
          <thead className="sticky top-0 bg-gray-200 z-10">
            <tr>
              <th className="px-4 py-2 text-center">Page ID</th>
              <th className="px-4 py-2 text-center">Access Token</th>
              <th className="px-4 py-2 text-center">Max Workers</th>
              <th className="px-4 py-2 text-center">Message Title</th>
              <th className="px-4 py-2 text-center">Start Date</th>
              <th className="px-4 py-2 text-center">End Date</th>
              <th className="px-4 py-2 text-center">Start Time</th>
              <th className="px-4 py-2 text-center">End Time</th>
              <th className="px-4 py-2 text-center">Scheduled Date</th>
              <th className="px-4 py-2 text-center">Scheduled Time</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Success</th>
              <th className="px-4 py-2 text-center">Failed</th>
              <th className="px-4 py-2 text-center">Total Response</th>
            </tr>
          </thead>
          <tbody>
            {/* Render rows with their original order */}
            {Object.values(tableData).map((row, index) => (
              <tr
                key={index}
                className={`border-t ${selectedIndex === index ? "bg-blue-100" : ""}`}
                onClick={() => handleSelectIndex(index)}
              >
                <td className="px-4 py-2 text-center overflow-hidden whitespace-nowrap text-ellipsis max-w-[100px]" title={row.page_id}>
                  {row.page_id}
                </td>
                <td className="px-4 py-2 text-center overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]" title={row.access_token}>
                  {row.access_token}
                </td>

                <td className="px-4 py-2 text-center">{row.max_workers}</td>
                <td className="px-4 py-2 text-center">{row.message_title}</td>
                <td className="px-4 py-2 text-center">{row.start_date}</td>
                <td className="px-4 py-2 text-center">{row.end_date}</td>
                <td className="px-4 py-2 text-center">{row.start_time}</td>
                <td className="px-4 py-2 text-center">{row.end_time}</td>
                <td className="px-4 py-2 text-center">{row.schedule_date}</td>
                <td className="px-4 py-2 text-center">{row.schedule_time}</td>
                <td className="px-4 py-2 text-center">{row.status}</td>
                <td className="px-4 py-2 text-center">{row.success}</td>
                <td className="px-4 py-2 text-center">{row.failed}</td>
                <td className="px-4 py-2 text-center">{row.totalResponse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isDialogOpen && selectedIndex !== null && (
        <EditDialogAutoMessage
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          selectedData={tableData[selectedIndex]} // Pass selected data
          onSave={handleDialogSave}
          selectedIndex={selectedIndex}
        />
      )}
    </div>
  );
}

export default TableTreeWidget;
