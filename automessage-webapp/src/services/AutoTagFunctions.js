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

export const saveTagData = async (data_scheduled_tag) => {
  const apiEndpoint = `${baseURL}/schedule-tag`;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data_scheduled_tag),
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


export const stop_ScheduleTag = async (task_id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Authorization token is missing.");
    return { error: "Unauthorized" };
  }

  const apiEndpoint = `${baseURL}/stop-tag-schedule/${task_id}`;

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
      console.log("Schedule stopped successfully:", data);
      return data;
    } else {
      const errorData = await response.json();
      console.error("Failed to stop schedule:", response.status, errorData);
      return { error: errorData };
    }
  } catch (error) {
    // console.error("Error stopping schedule:", error);
    return { error: error.message };
  }
};




export const fetchDataTag = async () => {
  const apiEndpoint = `${baseURL}/get-tags-data`;
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

export const updateTagData = async (editedScheduleData) => {
  const apiEndpoint = `${baseURL}/update-tag-data`;
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

export const fetchTagList = async (page_id, access_token) => {
    const apiEndpoint = `${baseURL}/get-tags-list`; // Your API endpoint
    
    // Construct the query parameters
    const url = new URL(apiEndpoint);
    url.searchParams.append("page_id", page_id); // Add page_id as a query parameter
    url.searchParams.append("access_token", access_token); // Add access_token as a query parameter
  
    try {
      const response = await fetch(url.toString(), {  // Use the updated URL with query params
        method: "GET",
        headers: {
          "Content-Type": "application/json", // Set the content type as JSON
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

  export const clearData = async () => {
    const apiEndpoint = `${baseURL}/remove-tag-data`;  // Flask endpoint for clearing data
    const token = localStorage.getItem("token");  // JWT token
  
    if (!token) {
      notify("Unauthorized: No access token", "error");
      return { error: "Unauthorized" };
    }
  
    try {
      const response = await fetch(apiEndpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      });
  
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "An error occurred while removing tag data");
      }
  
      notify("Data cleared successfully!", "success");
      return { status: response.status, data: responseData };  // Return the server's response data
    } catch (error) {
      notify(error.message, "error");
      throw error;  // Re-throw the error for handling in the calling code
    }
  };