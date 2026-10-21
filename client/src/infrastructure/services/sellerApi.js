import {
  getAccessToken,
  httpRequest,
  refreshAccessSession,
  setAccessToken,
} from "../api/httpClient.js";

export { getAccessToken };

export function registerSeller({
  name,
  email,
  password,
  role = "seller",
  storeName,
}) {
  return httpRequest("/api/users/register", {
    method: "POST",
    body: { name, email, password, role, storeName },
  });
}

export async function loginSeller({ email, password }) {
  const result = await httpRequest("/api/users/login", {
    method: "POST",
    body: { email, password },
  });

  setAccessToken(result?.data?.accessToken);
  return result;
}

export function refreshSellerSession() {
  return refreshAccessSession();
}

export async function getShoppingUser() {
  let token = getAccessToken();
  if (!token) {
    try {
      const session = await refreshSellerSession();
      token = session?.data?.accessToken || "";
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  }

  if (!token) return null;

  try {
    const result = await fetchSellerProfile(token);
    const user = result?.data?.user;
    return ["customer", "seller"].includes(user?.role) ? user : null;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function logoutSeller() {
  try {
    return await httpRequest("/api/users/logout", {
      method: "POST",
    });
  } finally {
    setAccessToken("");
  }
}

export function verifySellerEmail(token) {
  return httpRequest("/api/users/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function resendSellerVerification(email) {
  return httpRequest("/api/users/resend-verification", {
    method: "POST",
    body: { email },
  });
}

export function requestSellerPasswordReset(email) {
  return httpRequest("/api/users/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetSellerPassword(token, password) {
  const result = await httpRequest("/api/users/reset-password", {
    method: "POST",
    body: { token, password },
  });
  setAccessToken("");
  return result;
}

export function fetchSellerProfile(token = getAccessToken(), { signal } = {}) {
  return httpRequest("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}

export function fetchSellerProducts(
  token = getAccessToken(),
  { page = 1, limit = 12, signal } = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return httpRequest(`/api/products/mine?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}

export function fetchSellerOrders(
  token = getAccessToken(),
  { page = 1, limit = 20, signal } = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return httpRequest(`/api/orders/seller?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}

export function createSellerProduct(token, product) {
  return httpRequest("/api/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: product,
  });
}

export function updateSellerProduct(token, productId, product) {
  return httpRequest(`/api/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: product,
  });
}

export function setSellerProductActive(token, productId, isActive) {
  return httpRequest(
    `/api/products/${encodeURIComponent(productId)}/status`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: { isActive },
    }
  );
}
