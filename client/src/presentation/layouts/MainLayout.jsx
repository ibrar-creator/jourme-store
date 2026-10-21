
import { useCallback, useEffect, useState } from "react";

import AnnouncementBar from "../components/layout/AnnouncementBar.jsx";
import Header from "../components/layout/Header.jsx";
import Footer from "../components/layout/Footer.jsx";
import CartDrawer from "../components/cart/CartDrawer.jsx";

export default function MainLayout({ children }) {
  const [cartOpen, setCartOpen] = useState(false);

  const openCart = useCallback(() => {
    setCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  useEffect(() => {
    function handleOpenCart() {
      openCart();
    }

    window.addEventListener("jourme:open-cart", handleOpenCart);

    return () => {
      window.removeEventListener("jourme:open-cart", handleOpenCart);
    };
  }, [openCart]);

  return (
    <div className="min-h-screen bg-white text-black">
      <AnnouncementBar />

      <Header />

      <main>{children}</main>

      <Footer />

     <CartDrawer
  open={cartOpen}
  onClose={closeCart}
  onCheckout={() => {
    closeCart();
    window.dispatchEvent(new CustomEvent("jourme:checkout"));
  }}
/>
    </div>
  );
}
