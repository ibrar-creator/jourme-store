const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

let accessToken = "";
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || "";
}

export function getAccessToken() {
  return accessToken;
}

export function refreshAccessSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setAccessToken("");
        const error = new Error(
          data?.message || `Session refresh failed with status ${response.status}.`
        );
        error.status = response.status;
        throw error;
      }

      setAccessToken(data?.data?.accessToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function refreshAccessToken() {
  return refreshAccessSession()
    .then(() => accessToken)
    .catch(() => {
      setAccessToken("");
      return "";
    });
}

export async function httpRequest(
  path,
  { method = "GET", headers = {}, body, signal } = {}
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const requestHeaders = {
    Accept: "application/json",
    ...(body !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...headers,
  };
  const requestOptions = {
    method,
    headers: requestHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal,
    credentials: "include",
  };

  let response = await fetch(`${API_BASE_URL}${normalizedPath}`, requestOptions);

  if (
    response.status === 401 &&
    requestHeaders.Authorization &&
    normalizedPath !== "/api/users/refresh"
  ) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      requestHeaders.Authorization = `Bearer ${refreshedToken}`;
      response = await fetch(`${API_BASE_URL}${normalizedPath}`, requestOptions);
    }
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && data.message
        ? data.message
        : `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
