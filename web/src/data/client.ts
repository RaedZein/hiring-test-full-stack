import axios from "axios";
import { toast } from "sonner";
import { getErrorMessage } from "../lib/error-utils";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: "richard",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = getErrorMessage(error);
    if (message) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);