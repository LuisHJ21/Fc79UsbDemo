import axios from "axios";

export const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  //withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
