import React, { createContext, useContext, useEffect, useState } from "react";
import { clampQty, qtyStep } from "../lib/units.js";

const CartContext = createContext(null);

const STORAGE_KEY = "zetmarket_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, qty) {
    const unit = product.unit || "dona";
    const addQty = qty ?? qtyStep(unit);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: clampQty(i.qty + addQty, unit) } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.newPrice,
          imageUrl: product.imageUrl,
          unit,
          qty: clampQty(addQty, unit),
        },
      ];
    });
  }

  function increment(productId) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, qty: clampQty(i.qty + qtyStep(i.unit), i.unit) } : i
      )
    );
  }

  function decrement(productId) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, qty: Number((i.qty - qtyStep(i.unit)).toFixed(2)) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  function setCartFromOrder(orderItems) {
    setItems(
      orderItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        imageUrl: i.imageUrl,
        unit: i.unit || "dona",
        qty: i.qty,
      }))
    );
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        increment,
        decrement,
        removeItem,
        clearCart,
        setCartFromOrder,
        total,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart faqat CartProvider ichida ishlatilishi kerak");
  return ctx;
}
