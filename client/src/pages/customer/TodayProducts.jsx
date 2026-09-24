import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./TodayProducts.css";

const CART_KEY = "fishShopCart";

// ======================================================
// TODAY PRODUCTS
// ======================================================

const TodayProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cart, setCart] = useState(() => {
    try {
      const saved =
        localStorage.getItem(CART_KEY);

      return saved
        ? JSON.parse(saved)
        : [];
    } catch {
      return [];
    }
  });

  // ====================================================
  // SAVE CART
  // ====================================================

  useEffect(() => {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  // ====================================================
  // FETCH TODAY'S PRODUCTS
  // ====================================================

  const fetchProducts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/daily-products/today"
          );

        console.log(
          "TODAY PRODUCTS:",
          response.data
        );

        const data =
          response.data?.dailyProducts ||
          response.data?.products ||
          [];

        setProducts(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "TODAY PRODUCTS ERROR:",
          err.response?.data ||
            err.message
        );

        setProducts([]);

        setError(
          err.response?.data?.message ||
            "Unable to load today's products"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ====================================================
  // PRICE INFO
  // ====================================================

  const getRateInfo = (item) => {
    const unit =
      item?.unit;

    const unitPrice =
      Number(item?.unitPrice);

    const rateQuantity =
      Number(item?.rateQuantity);

    if (
      !["piece", "g", "kg"].includes(
        unit
      ) ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !Number.isFinite(rateQuantity) ||
      rateQuantity <= 0
    ) {
      return null;
    }

    let quantityLabel = "";

    if (unit === "piece") {
      quantityLabel =
        `${rateQuantity} ${
          rateQuantity === 1
            ? "piece"
            : "pieces"
        }`;
    } else {
      quantityLabel =
        `${rateQuantity}${unit}`;
    }

    return {
      unit,
      unitPrice,
      rateQuantity,
      quantityLabel,
    };
  };

  // ====================================================
  // CART HELPERS
  // ====================================================

  const getCartItem = (id) =>
    cart.find(
      (item) =>
        item.dailyProductId === id
    );

  const getCartQuantity = (id) =>
    getCartItem(id)?.quantity || 0;

  // ====================================================
  // ADD TO CART
  // ====================================================

  const addToCart = (item) => {
    const rateInfo =
      getRateInfo(item);

    if (!rateInfo) {
      alert(
        "Invalid product price."
      );
      return;
    }

    setCart((previousCart) => {
      const existing =
        previousCart.find(
          (cartItem) =>
            cartItem.dailyProductId ===
            item._id
        );

      if (existing) {
        if (
          Number(existing.quantity) >=
          Number(item.stockQuantity)
        ) {
          return previousCart;
        }

        return previousCart.map(
          (cartItem) =>
            cartItem.dailyProductId ===
            item._id
              ? {
                  ...cartItem,
                  quantity:
                    cartItem.quantity + 1,
                }
              : cartItem
        );
      }

      return [
        ...previousCart,
        {
          dailyProductId: item._id,

          productId:
            item.product?._id || "",

          productName:
            item.product?.name || "",

          name:
            item.product?.name || "",

          variety:
            item.variety || "",

          category:
            item.product?.category || "",

          // IMPORTANT:
          // daily image, NOT product image
          image:
            item.image || "",

          rate:
            item.rate || "",

          unitPrice:
            rateInfo.unitPrice,

          unit:
            rateInfo.unit,

          rateQuantity:
            rateInfo.rateQuantity,

          rateQuantityLabel:
            rateInfo.quantityLabel,

          availableQuantity:
            item.availableQuantity || "",

          stockQuantity:
            Number(item.stockQuantity) || 0,

          quantity: 1,
        },
      ];
    });
  };

  // ====================================================
  // INCREASE
  // ====================================================

  const increaseQuantity = (
    item
  ) => {
    setCart((previousCart) =>
      previousCart.map(
        (cartItem) => {
          if (
            cartItem.dailyProductId !==
            item._id
          ) {
            return cartItem;
          }

          if (
            cartItem.quantity >=
            Number(item.stockQuantity)
          ) {
            return cartItem;
          }

          return {
            ...cartItem,
            quantity:
              cartItem.quantity + 1,
          };
        }
      )
    );
  };

  // ====================================================
  // DECREASE
  // ====================================================

  const decreaseQuantity = (
    item
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((cartItem) => {
          if (
            cartItem.dailyProductId !==
            item._id
          ) {
            return cartItem;
          }

          return {
            ...cartItem,
            quantity:
              cartItem.quantity - 1,
          };
        })
        .filter(
          (cartItem) =>
            cartItem.quantity > 0
        )
    );
  };

  // ====================================================
  // CART COUNT
  // ====================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="today-products-page">
        <div className="today-products-loading">
          <div className="loading-spinner" />

          <h2>
            Loading today's fresh products...
          </h2>
        </div>
      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="today-products-page">
      {/* HEADER */}

      <header className="today-products-header">
        <button
          className="today-back-button"
          onClick={() =>
            navigate(
              "/customer-home"
            )
          }
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="today-title-area">
          <span>
            FRESH EVERY DAY
          </span>

          <h1>
            Today's Products
          </h1>

          <p>
            Choose your fresh fish,
            chicken and meat for today.
          </p>
        </div>

        <button
          className="today-cart-button"
          onClick={() =>
            navigate("/cart")
          }
        >
          <ShoppingCart size={19} />

          <span>Cart</span>

          {cartCount > 0 && (
            <b>
              {cartCount}
            </b>
          )}
        </button>
      </header>

      {/* ERROR */}

      {error && (
        <div className="today-error">
          <strong>
            Unable to load products
          </strong>

          <span>
            {error}
          </span>

          <button
            onClick={
              fetchProducts
            }
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* EMPTY */}

      {!error &&
        products.length === 0 && (
          <div className="today-empty">
            <Package size={54} />

            <h2>
              No products available today
            </h2>

            <p>
              Please check again later.
            </p>
          </div>
        )}

      {/* PRODUCTS */}

      {products.length > 0 && (
        <main className="today-products-container">
          <div className="today-products-grid">
            {products.map((item) => {
              const rateInfo =
                getRateInfo(item);

              const cartQuantity =
                getCartQuantity(
                  item._id
                );

              const image =
                item.image ||
                "/placeholder-product.png";

              return (
                <article
                  className="today-product-card"
                  key={item._id}
                >
                  {/* IMAGE */}

                  <div className="today-product-image">
                    <img
                      src={image}
                      alt={
                        item.variety ||
                        item.product?.name ||
                        "Product"
                      }
                      onError={(e) => {
                        e.currentTarget.src =
                          "/placeholder-product.png";
                      }}
                    />

                    <span className="today-category">
                      {item.product
                        ?.category ||
                        "Fresh"}
                    </span>
                  </div>

                  {/* CONTENT */}

                  <div className="today-product-content">
                    <p className="today-product-main-name">
                      {item.product?.name}
                    </p>

                    <h2>
                      {item.variety}
                    </h2>

                    {item.rate && (
                      <div className="today-rate">
                        <strong>
                          ₹
                          {rateInfo?.unitPrice?.toFixed(
                            0
                          ) ||
                            "0"}
                        </strong>

                        {rateInfo && (
                          <span>
                            /{" "}
                            {
                              rateInfo.quantityLabel
                            }
                          </span>
                        )}
                      </div>
                    )}

                    {item.availableQuantity && (
                      <p className="today-stock-text">
                        Available:{" "}
                        {
                          item.availableQuantity
                        }
                      </p>
                    )}

                    {/* CART */}

                    <div className="today-card-action">
                      {cartQuantity === 0 ? (
                        <button
                          className="add-to-cart-button"
                          onClick={() =>
                            addToCart(item)
                          }
                          disabled={
                            Number(
                              item.stockQuantity
                            ) <= 0
                          }
                        >
                          <Plus
                            size={18}
                          />
                          Add to Cart
                        </button>
                      ) : (
                        <div className="quantity-control">
                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item
                              )
                            }
                          >
                            <Minus
                              size={17}
                            />
                          </button>

                          <span>
                            {cartQuantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item
                              )
                            }
                            disabled={
                              cartQuantity >=
                              Number(
                                item.stockQuantity
                              )
                            }
                          >
                            <Plus
                              size={17}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
};

export default TodayProducts;