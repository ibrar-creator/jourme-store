
import { httpRequest } from "../api/httpClient.js";

export async function fetchProducts({
  category,
  search,
  page = 1,
  limit = 12,
  signal,
} = {}) {
  const params = new URLSearchParams();

  if (category && category !== "All") {
    params.set("category", category);
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  params.set("page", String(page));
  params.set("limit", String(limit));

  const query = params.toString();

  return httpRequest(`/api/products?${query}`, {
    method: "GET",
    signal,
  });
}

export async function fetchProductById(id, { signal } = {}) {
  if (!id) {
    throw new Error("Product ID is required.");
  }

  return httpRequest(
    `/api/products/${encodeURIComponent(id)}`,
    {
      method: "GET",
      signal,
    }
  );
}
