
import { useEffect, useState } from "react";

import HomePage from "./presentation/pages/HomePage.jsx";
import CheckoutPage from "./presentation/pages/CheckoutPage.jsx";
import ProductDetailPage from "./presentation/pages/ProductDetailPage.jsx";
import CustomerAccountPage from "./presentation/pages/CustomerAccountPage.jsx";
import SellerDashboardPage from "./presentation/pages/SellerDashboardPage.jsx";
import { getPendingCart } from "./infrastructure/services/pendingCart.js";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.pathname === "/seller") return "seller";
    if (window.location.pathname === "/account") return "account";
    if (window.location.pathname === "/admin") return "admin";
    return "home";
  });
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    function openCheckout() {
      setCurrentPage("checkout");
      scrollToTop();
    }

    function openHome() {
      if (window.location.pathname !== "/") {
        window.history.pushState({}, "", "/");
      }
      setCurrentPage("home");
      scrollToTop();
    }

    function openSellerDashboard() {
      if (window.location.pathname !== "/seller") {
        window.history.pushState({}, "", "/seller");
      }
      setCurrentPage("seller");
      scrollToTop();
    }

    function openAccount() {
      if (window.location.pathname !== "/account") {
        window.history.pushState({}, "", "/account");
      }
      setCurrentPage("account");
      scrollToTop();
    }

    function openAdminPortal() {
      if (window.location.pathname !== "/admin") {
        window.history.pushState({}, "", "/admin");
      }
      setCurrentPage("admin");
      scrollToTop();
    }

    function handlePopState() {
      const routes = {
        "/seller": "seller",
        "/account": "account",
        "/admin": "admin",
      };
      setCurrentPage(routes[window.location.pathname] || "home");
    }

    function openProduct(event) {
      const productId = event.detail?.productId;

      if (!productId) return;

      setSelectedProductId(productId);
      setCurrentPage("product");
      scrollToTop();
    }

    function resumePendingCart(event) {
      const productId = event.detail?.productId || getPendingCart()?.productId;
      if (!productId) return;

      setSelectedProductId(productId);
      setCurrentPage("product");
      scrollToTop();
    }

    window.addEventListener("jourme:checkout", openCheckout);
    window.addEventListener("jourme:home", openHome);
    window.addEventListener("jourme:seller", openSellerDashboard);
    window.addEventListener("jourme:account", openAccount);
    window.addEventListener("jourme:admin", openAdminPortal);
    window.addEventListener("jourme:product", openProduct);
    window.addEventListener("jourme:resume-cart", resumePendingCart);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("jourme:checkout", openCheckout);
      window.removeEventListener("jourme:home", openHome);
      window.removeEventListener("jourme:seller", openSellerDashboard);
      window.removeEventListener("jourme:account", openAccount);
      window.removeEventListener("jourme:admin", openAdminPortal);
      window.removeEventListener("jourme:product", openProduct);
      window.removeEventListener("jourme:resume-cart", resumePendingCart);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  if (currentPage === "account") {
    return <CustomerAccountPage />;
  }

  if (["seller", "admin"].includes(currentPage)) {
    const role = {
      seller: "seller",
      admin: "admin",
    }[currentPage];
    return <SellerDashboardPage accountRole={role} />;
  }

  if (currentPage === "checkout") {
    return <CheckoutPage />;
  }

  if (currentPage === "product") {
    return <ProductDetailPage productId={selectedProductId} />;
  }

  return <HomePage />;
}
