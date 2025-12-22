/*const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default API_BASE_URL;*/


const  API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (! API_BASE_URL) {
  throw new Error("REACT_APP_API_BASE_URL is not defined");
}

export default  API_BASE_URL;