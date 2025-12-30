import axios from "axios";
import { toast } from "sonner";
import { getErrorMessage } from "../lib/error-utils";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
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