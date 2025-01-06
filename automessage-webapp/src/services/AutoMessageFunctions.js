import notify from "../pages/components/Toast.js";

const apiUrl = process.env.REACT_APP_AUTOMESSAGE_TAG_API_LINK;

const baseURL = apiUrl; // Base URL for the backend

/**
 * Function to update data in the Redis backend using fetch
 * @param {string} redisKey - Redis key to identify the data
 * @param {string} accessKey - Access key associated with the Redis key
 * @param {Object} newData - New data to update in Redis
 * @returns {Promise} - Resolves with the server response or rejects with an error
 */

export const saveData = async (data_scheduled_messages) => {
  const apiEndpoint = `${baseURL}/schedule-message`;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data_scheduled_messages),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw { status: response.status, message: responseData.message || "An error occurred" };
    }
    return { status: response.status, data: responseData ,};
  } catch (error) {
    notify(error.message, 'error' );
    throw error;
  }
};


export const stop_Schedule = async (task_id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Authorization token is missing.");
    return { error: "Unauthorized" };
  }

  const apiEndpoint = `${baseURL}/stop-schedule/${task_id}`;

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // console.log("Schedule stopped successfully:", data);
      return data;
    } else {
      const errorData = await response.json();
      // console.error("Failed to stop schedule:", response.status, errorData);
      return { error: errorData };
    }
  } catch (error) {
    // console.error("Error stopping schedule:", error);
    return { error: error.message };
  }
};




export const fetchData = async () => {
  const apiEndpoint = `${baseURL}/get-schedule-message`;
  const token = localStorage.getItem("token");  // JWT token

  try {
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include token in headers
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Parse the response JSON
    return data; // Return the fetched data
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw the error for handling in the calling code
  }
};

export const editData = async (editedScheduleData) => {
  const apiEndpoint = `${baseURL}/update-schedule-message`;
  const token = localStorage.getItem("token");

  console.log(JSON.stringify(editedScheduleData));

  try {
    const response = await fetch(apiEndpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Include JWT token in headers
      },
      body: JSON.stringify(editedScheduleData), // Send the request body as JSON
    });

    const responseData = await response.json(); // Parse the response JSON
    if (!response.ok) {
      throw { status: response.status, message: responseData.message || "An error occurred" };
    }
    notify ("Update Schedule Successfully" , 'success')
    return { status: response.status, data: responseData };
 // Return the response data
  } catch (error) {
    notify(error.message, 'error' );
    throw error; // Re-throw the error to handle it in the calling code
  }
};
