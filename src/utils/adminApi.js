import { fetchWithTimeout } from "./fetchWithTimeout";

const OFFLINE_MESSAGE =
  "We can't reach the server right now. Please check your connection and try again.";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const endSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.assign("/");
};

export const adminRequest = async (path, { method = "GET", body } = {}) => {
  const token = localStorage.getItem("token");
  let response;
  try {
    response = await fetchWithTimeout(
      path,
      {
        method,
        headers: {
          Accept: "application/json",
          ...(body && { "Content-Type": "application/json" }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      },
      15000
    );
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    endSession();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }
  if (!data) {
    throw new ApiError(
      response.status >= 500 ? OFFLINE_MESSAGE : "Unexpected response from the server",
      response.status
    );
  }
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || "Request failed", response.status);
  }
  return data;
};

export const buildQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};
