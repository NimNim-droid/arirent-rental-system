import axios from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as {
      message?: string;
      errors?: Record<string, string[] | string>;
    } | null;

    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Unable to connect to the server. Please try again.";
    }
    if (status === 401) {
      return data?.message || "Your session has expired. Please log in again.";
    }
    if (status === 403) {
      return data?.message || "You do not have permission to perform this action.";
    }
    if (status === 404) {
      return data?.message || "The requested resource was not found.";
    }
    if (status === 409) {
      return data?.message || "The request conflicts with the current state of the data.";
    }
    if (status === 422) {
      const errors = data?.errors;
      if (errors) {
        const firstKey = Object.keys(errors)[0];
        const first = errors[firstKey];
        return Array.isArray(first) ? first[0] : String(first);
      }
      return data?.message || "Please check the form and try again.";
    }
    if (status && status >= 500) {
      return data?.message || "Something went wrong on the server. Please try again.";
    }
    return data?.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}