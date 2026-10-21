
import { fetchProducts } from "../../infrastructure/services/productApi.js";
import { normalizeProduct } from "../../domain/entities/Product.js";

export async function getProducts(filters = {}) {
  const response = await fetchProducts(filters);

  if (!response?.success || !Array.isArray(response.data)) {
    throw new Error("Unable to retrieve products from the server.");
  }

  const products = response.data.map(normalizeProduct);

  return {
    products,
    pagination: response.pagination ?? {
      page: 1,
      limit: products.length,
      total: products.length,
      totalPages: products.length > 0 ? 1 : 0,
    },
  };
}
