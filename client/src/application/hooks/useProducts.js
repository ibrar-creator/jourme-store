
import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "../../infrastructure/services/productApi.js";

export function useProducts({
  category = "All",
  search = "",
  page = 1,
  limit = 12,
} = {}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const result = await fetchProducts({
          category,
          search,
          page,
          limit,
          signal,
        });

        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error("Invalid products response from the server.");
        }

        setProducts(result.data);
        setPagination(
          result.pagination ?? {
            page,
            limit,
            total: result.data.length,
            totalPages: result.data.length > 0 ? 1 : 0,
          }
        );
      } catch (err) {
        if (err.name === "AbortError") return;

        setProducts([]);
        setError(err.message || "Unable to load products.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [category, search, page, limit]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadProducts(controller.signal);

    return () => controller.abort();
  }, [loadProducts]);

  const refreshProducts = useCallback(() => {
    const controller = new AbortController();
    return loadProducts(controller.signal);
  }, [loadProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    refreshProducts,
  };
}
