import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Package,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import "./Cart.css";

const Cart = () => {
  const navigate =
    useNavigate();

  const [cart, setCart] =
    useState([]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "fishShopCart"
        );

      const parsed = saved
        ? JSON.parse(saved)
        : [];

      setCart(
        Array.isArray(parsed)
          ? parsed
          : []
      );
    } catch {
      setCart([]);
    }
  }, []);

  const saveCart = (
    nextCart
  ) => {
    setCart(nextCart);

    localStorage.setItem(
      "fishShopCart",
      JSON.stringify(
        nextCart
      )
    );
  };

  const increaseQuantity = (
    id
  ) => {
    const nextCart =
      cart.map((item) => {
        if (
          item.dailyProductId !==
          id
        ) {
          return item;
        }

        const stock =
          Number(
            item.stockQuantity
          ) || 0;

        const quantity =
          Number(
            item.quantity
          ) || 0;

        if (
          stock > 0 &&
          quantity >= stock
        ) {
          alert(
            `Only ${stock} portion(s) available.`
          );

          return item;
        }

        return {
          ...item,
          quantity:
            quantity + 1,
        };
      });

    saveCart(nextCart);
  };

  const decreaseQuantity = (
    id
  ) => {
    const nextCart =
      cart.map((item) => {
        if (
          item.dailyProductId !==
          id
        ) {
          return item;
        }

        return {
          ...item,
          quantity:
            Math.max(
              1,
              Number(
                item.quantity
              ) - 1
            ),
        };
      });

    saveCart(nextCart);
  };

  const removeItem = (
    id
  ) => {
    saveCart(
      cart.filter(
        (item) =>
          item.dailyProductId !==
          id
      )
    );
  };

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(
            item.unitPrice
          ) *
            Number(
              item.quantity
            ),
        0
      ),
    [cart]
  );

  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity
        ),
      0
    );

  const getPortionText = (
    item
  ) => {
    const rateQuantity =
      Number(
        item.rateQuantity
      ) || 1;

    if (
      item.unit ===
      "piece"
    ) {
      return `${rateQuantity} piece${
        rateQuantity === 1
          ? ""
          : "s"
      }`;
    }

    if (
      item.unit === "kg"
    ) {
      return `${rateQuantity} kg`;
    }

    return `${rateQuantity}g`;
  };

  if (!cart.length) {
    return (
      <div className="cart-page">
        <div className="cart-empty-card">
          <ShoppingBag
            size={45}
          />

          <h1>
            Your cart is empty
          </h1>

          <p>
            Add today's fresh
            products to continue.
          </p>

          <button
            onClick={() =>
              navigate(
                "/products"
              )
            }
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <button
          className="cart-back-button"
          onClick={() =>
            navigate(
              "/products"
            )
          }
        >
          <ArrowLeft size={17} />
          Continue Shopping
        </button>

        <div className="cart-header">
          <div>
            <span>
              FRESHCUT
            </span>

            <h1>
              Your Cart
            </h1>

            <p>
              Review your fresh
              selection before
              checkout.
            </p>
          </div>

          <div className="cart-count-card">
            <strong>
              {totalQuantity}
            </strong>

            <span>
              portions
            </span>
          </div>
        </div>

        <div className="cart-layout">
          <section className="cart-items-card">
            <div className="cart-section-heading">
              <div>
                <h2>
                  Selected Products
                </h2>

                <p>
                  {cart.length}{" "}
                  {cart.length ===
                  1
                    ? "product"
                    : "products"}
                </p>
              </div>

              <button
                className="clear-cart-button"
                onClick={() => {
                  localStorage.removeItem(
                    "fishShopCart"
                  );
                  setCart([]);
                }}
              >
                Clear Cart
              </button>
            </div>

            <div className="cart-items-list">
              {cart.map(
                (item) => {
                  const quantity =
                    Number(
                      item.quantity
                    ) || 0;

                  const unitPrice =
                    Number(
                      item.unitPrice
                    ) || 0;

                  const total =
                    unitPrice *
                    quantity;

                  return (
                    <article
                      className="cart-item"
                      key={
                        item.dailyProductId
                      }
                    >
                      <div className="cart-item-image">
                        {item.image ? (
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.variety
                            }
                          />
                        ) : (
                          <Package
                            size={30}
                          />
                        )}
                      </div>

                      <div className="cart-item-details">
                        <span>
                          {item.name}
                        </span>

                        <h3>
                          {
                            item.variety
                          }
                        </h3>

                        <p>
                          {
                            item.rate
                          }
                        </p>

                        <small>
                          1 ×{" "}
                          {getPortionText(
                            item
                          )}{" "}
                          = ₹
                          {unitPrice.toFixed(
                            2
                          )}
                        </small>
                      </div>

                      <div className="cart-item-controls">
                        <div className="quantity-control">
                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.dailyProductId
                              )
                            }
                          >
                            <Minus
                              size={15}
                            />
                          </button>

                          <strong>
                            {
                              quantity
                            }
                          </strong>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.dailyProductId
                              )
                            }
                          >
                            <Plus
                              size={15}
                            />
                          </button>
                        </div>

                        <strong>
                          ₹
                          {total.toFixed(
                            2
                          )}
                        </strong>

                        <button
                          className="remove-cart-item"
                          onClick={() =>
                            removeItem(
                              item.dailyProductId
                            )
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>

          <aside className="cart-summary-card">
            <span>
              ORDER SUMMARY
            </span>

            <h2>
              Checkout
            </h2>

            <div className="summary-lines">
              <div>
                <span>
                  Products
                </span>

                <strong>
                  {cart.length}
                </strong>
              </div>

              <div>
                <span>
                  Portions
                </span>

                <strong>
                  {totalQuantity}
                </strong>
              </div>

              <div>
                <span>
                  Shop Pickup
                </span>

                <strong>
                  FREE
                </strong>
              </div>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-grand-total">
              <span>
                Total
              </span>

              <strong>
                ₹
                {subtotal.toFixed(
                  2
                )}
              </strong>
            </div>

            <button
              className="checkout-button"
              onClick={() =>
                navigate(
                  "/checkout"
                )
              }
            >
              Continue to Checkout
              <ArrowRight
                size={18}
              />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;