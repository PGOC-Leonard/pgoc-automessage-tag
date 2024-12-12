// utils.js
export const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1]; // Get the payload part of the token
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Convert base64URL to base64
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload); // Return parsed JWT payload
    } catch (e) {
      return null; // In case the token is malformed
    }
  };
  
  export const isTokenExpired = (token) => {
    const decoded = decodeJwt(token);
    if (decoded && decoded.exp) {
      return decoded.exp * 1000 < Date.now(); // Compare expiration time with current time
    }
    return true;
  };
  