import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./DailyInventory.css";

const getToday = () => {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const DailyInventory = () => {
  const [products, setProducts] = useState([]);
  const [dailyProducts, setDailyProducts] = useState([]);

  const [form, setForm] = useState({
    product: "",
    date: getToday(),
    variety: "",
    rate: "",
    availableQuantity: "",
    stockQuantity: "",
    isAvailable: true,
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // FETCH MASTER PRODUCTS
  // =========================================================

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setError("");

      const response = await api.get("/products");

      setProducts(response.data?.products || []);
    } catch (err) {
      console.error("PRODUCT FETCH ERROR:", err);

      setProducts([]);

      setError(
        err.response?.data?.message ||
          "Failed to load products"
      );
    } finally {
      setProductsLoading(false);
    }
  };

  // =========================================================
  // FETCH DAILY PRODUCTS
  // =========================================================

  const fetchDailyProducts = async () => {
    try {
      const response = await api.get(
        `/daily-products?date=${form.date}`
      );

      setDailyProducts(
        response.data?.dailyProducts || []
      );
    } catch (err) {
      console.error(
        "DAILY PRODUCT FETCH ERROR:",
        err
      );

      setDailyProducts([]);

      setError(
        err.response?.data?.message ||
          "Failed to load daily inventory"
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchProducts();
  }, []);

  // =========================================================
  // LOAD DAILY PRODUCTS WHEN DATE CHANGES
  // =========================================================

  useEffect(() => {
    if (form.date) {
      fetchDailyProducts();
    }
  }, [form.date]);

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
    setMessage("");
  };

  // =========================================================
  // HANDLE PRODUCT CHANGE
  // =========================================================

  const handleProductChange = (e) => {
    const selectedId = e.target.value;

    setForm((previous) => ({
      ...previous,
      product: selectedId,
    }));

    /*
      Do not remove existing image when editing.
      Only clear image when selecting a different product
      while creating a new daily product.
    */
    if (!editingId) {
      setSelectedImage(null);
      setImagePreview("");
    }

    setError("");
    setMessage("");
  };

  // =========================================================
  // HANDLE IMAGE CHANGE
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file"
      );
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5 MB"
      );
      return;
    }

    setSelectedImage(file);

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);

    setError("");
    setMessage("");
  };

  // =========================================================
  // UPLOAD DAILY PRODUCT IMAGE
  // =========================================================

 const uploadDailyImage = async (
  dailyProductId,
  file
) => {
  try {
    if (!dailyProductId) {
      throw new Error(
        "Daily product ID is missing"
      );
    }

    if (!file) {
      throw new Error(
        "Please select an image"
      );
    }

    const formData = new FormData();

    formData.append("image", file);

    console.log(
      "IMAGE FILE:",
      file.name
    );

    console.log(
      "IMAGE TYPE:",
      file.type
    );

    console.log(
      "IMAGE SIZE:",
      file.size
    );

    const response = await api.put(
      `/daily-products/${dailyProductId}/image`,
      formData
    );

    console.log(
      "IMAGE UPLOAD RESPONSE:",
      response.data
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Image upload failed"
      );
    }

    return response.data;
  } catch (error) {
    console.error(
      "DAILY IMAGE UPLOAD ERROR:",
      error.response?.data || error
    );

    throw error;
  }
};

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      product: "",
      date: getToday(),
      variety: "",
      rate: "",
      availableQuantity: "",
      stockQuantity: "",
      isAvailable: true,
    });

    setSelectedImage(null);
    setImagePreview("");
    setEditingId(null);

    setError("");
    setMessage("");
  };

  // =========================================================
  // SUBMIT DAILY PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!form.product) {
      setError("Please select a product");
      return;
    }

    if (!form.variety.trim()) {
      setError(
        "Please enter dish / variety"
      );
      return;
    }

    if (!form.rate.trim()) {
      setError("Please enter rate");
      return;
    }

    if (!form.availableQuantity.trim()) {
      setError(
        "Please enter available quantity"
      );
      return;
    }

    if (
      form.stockQuantity === "" ||
      !Number.isFinite(
        Number(form.stockQuantity)
      ) ||
      Number(form.stockQuantity) < 0
    ) {
      setError(
        "Please enter a valid stock quantity"
      );
      return;
    }

    // -------------------------------------------------------
    // PAYLOAD
    // -------------------------------------------------------

    const payload = {
      product: form.product,
      date: form.date,
      variety: form.variety.trim(),
      rate: form.rate.trim(),
      availableQuantity:
        form.availableQuantity.trim(),
      stockQuantity: Number(
        form.stockQuantity
      ),
      isAvailable: form.isAvailable,
    };

    try {
      setLoading(true);

      let savedDailyProduct = null;

      // =====================================================
      // UPDATE EXISTING DAILY PRODUCT
      // =====================================================

      if (editingId) {
        const response = await api.put(
          `/daily-products/${editingId}`,
          payload
        );

        savedDailyProduct =
          response.data?.dailyProduct;

        if (!savedDailyProduct?._id) {
          throw new Error(
            "Daily product update failed"
          );
        }
      }

      // =====================================================
      // CREATE NEW DAILY PRODUCT
      // =====================================================

      else {
        const response = await api.post(
          "/daily-products",
          payload
        );

        savedDailyProduct =
          response.data?.dailyProduct;

        if (!savedDailyProduct?._id) {
          throw new Error(
            "Daily product creation failed"
          );
        }
      }

      // =====================================================
      // IMAGE UPLOAD
      // IMPORTANT:
      // UPLOAD ONLY ONCE
      // =====================================================

      if (
        selectedImage &&
        savedDailyProduct?._id
      ) {
        setUploadingImage(true);

        try {
          await uploadDailyImage(
            savedDailyProduct._id,
            selectedImage
          );

          /*
            IMPORTANT:
            Refresh AFTER successful image upload.

            This gets the latest image URL from MongoDB
            and displays it in the table.
          */
          await fetchDailyProducts();

          setMessage(
            editingId
              ? "Daily product and image updated successfully"
              : "Daily product and image added successfully"
          );
        } catch (imageError) {
          console.error(
            "IMAGE UPLOAD ERROR:",
            imageError
          );

          /*
            Product is already saved,
            but image upload failed.
          */
          setMessage(
            editingId
              ? "Daily product updated, but image upload failed"
              : "Daily product added, but image upload failed"
          );
        } finally {
          setUploadingImage(false);
        }
      } else {
        setMessage(
          editingId
            ? "Daily inventory updated successfully"
            : "Daily inventory added successfully"
        );

        // Refresh list even without image
        await fetchDailyProducts();
      }

      // =====================================================
      // RESET FORM
      // =====================================================

      setForm((previous) => ({
        ...previous,
        product: "",
        variety: "",
        rate: "",
        availableQuantity: "",
        stockQuantity: "",
        isAvailable: true,
      }));

      setSelectedImage(null);
      setImagePreview("");
      setEditingId(null);

      // Final refresh
      await fetchDailyProducts();
    } catch (err) {
      console.error(
        "SAVE DAILY PRODUCT ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // =========================================================
  // EDIT DAILY PRODUCT
  // =========================================================

  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      product:
        item.product?._id || "",

      date:
        item.date || getToday(),

      variety:
        item.variety || "",

      rate:
        item.rate || "",

      availableQuantity:
        item.availableQuantity || "",

      stockQuantity:
        item.stockQuantity ?? "",

      isAvailable:
        item.isAvailable !== false,
    });

    /*
      IMPORTANT:
      DailyProduct image is item.image.
      Do NOT use item.product.image here.
    */
    setImagePreview(
      item.image || ""
    );

    setSelectedImage(null);

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE DAILY PRODUCT
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this daily product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/daily-products/${id}`
      );

      setMessage(
        "Daily product deleted successfully"
      );

      await fetchDailyProducts();
    } catch (err) {
      console.error(
        "DELETE ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Delete failed"
      );
    }
  };

  // =========================================================
  // TOGGLE AVAILABILITY
  // =========================================================

  const toggleAvailability = async (
    item
  ) => {
    try {
      await api.put(
        `/daily-products/${item._id}`,
        {
          isAvailable:
            !item.isAvailable,
        }
      );

      setMessage(
        item.isAvailable
          ? "Product marked unavailable"
          : "Product marked available"
      );

      await fetchDailyProducts();
    } catch (err) {
      console.error(
        "TOGGLE ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update status"
      );
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="daily-inventory-page">
      <div className="inventory-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="inventory-header">
          <div>
            <div className="inventory-label">
              ADMIN PANEL
            </div>

            <h1>
              Daily Inventory
            </h1>

            <p>
              Manage today's fish,
              chicken and
              other varieties.
            </p>
          </div>

          <div className="date-box">
            <span>
              Selected Date
            </span>

            <strong>
              {form.date}
            </strong>
          </div>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =================================================
            ADD / EDIT CARD
        ================================================= */}

        <div className="inventory-card">

          <div className="card-title">
            <div>
              <h2>
                {editingId
                  ? "Edit Daily Product"
                  : "Add Daily Product"}
              </h2>

              <p>
                Add a separate image
                for every dish /
                variety.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>

          {/* =================================================
              PRODUCT
          ================================================= */}

          <div className="form-group">
            <label>
              Product
            </label>

            <select
              name="product"
              value={form.product}
              onChange={
                handleProductChange
              }
              disabled={
                productsLoading ||
                loading
              }
            >
              <option value="">
                {productsLoading
                  ? "Loading products..."
                  : "-- Select Product --"}
              </option>

              {products.map(
                (product) => (
                  <option
                    key={product._id}
                    value={product._id}
                  >
                    {product.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              IMAGE UPLOAD
          ================================================= */}

          <div className="image-upload-section">

            <div className="image-upload-header">
              <div>
                <h3>
                  Dish / Variety Image
                </h3>

                <p>
                  This image belongs
                  only to this daily
                  variety.
                </p>
              </div>
            </div>

            <div className="image-upload-content">

              {/* IMAGE PREVIEW */}

              <div className="image-upload-preview">

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={
                      form.variety ||
                      "Daily variety"
                    }
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    No Image
                  </div>
                )}

              </div>

              {/* IMAGE INPUT */}

              <div className="image-upload-controls">

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  disabled={
                    !form.product ||
                    loading
                  }
                />

                <small>
                  JPG, PNG, WEBP •
                  Maximum 5 MB
                </small>

                <small>
                  Image is saved for
                  this variety only.
                </small>

              </div>
            </div>
          </div>

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
          >

            <div className="form-grid">

              {/* DATE */}

              <div className="form-group">
                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />
              </div>

              {/* VARIETY */}

              <div className="form-group">
                <label>
                  Dish / Variety
                </label>

                <input
                  type="text"
                  name="variety"
                  value={form.variety}
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Chicken 65"
                  disabled={loading}
                />
              </div>

              {/* RATE */}

              <div className="form-group">
                <label>
                  Rate
                </label>

                <input
                  type="text"
                  name="rate"
                  value={form.rate}
                  onChange={
                    handleChange
                  }
                  placeholder="Example: ₹200/150g"
                  disabled={loading}
                />

                <small>
                  ₹30/piece •
                  ₹400/kg •
                  ₹200/150g
                </small>
              </div>

              {/* AVAILABLE QUANTITY */}

              <div className="form-group">
                <label>
                  Available Quantity
                </label>

                <input
                  type="text"
                  name="availableQuantity"
                  value={
                    form.availableQuantity
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: 20 pieces"
                  disabled={loading}
                />
              </div>

              {/* STOCK */}

              <div className="form-group">
                <label>
                  Stock Quantity
                </label>

                <input
                  type="number"
                  name="stockQuantity"
                  value={
                    form.stockQuantity
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                  placeholder="Example: 20"
                  disabled={loading}
                />

                <small>
                  For ₹200/150g,
                  20 means 20 ×
                  150g portions.
                </small>
              </div>

            </div>

            {/* =================================================
                AVAILABILITY
            ================================================= */}

            <div className="availability-row">

              <label className="switch-label">

                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={
                    form.isAvailable
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />

                <span>
                  Available for
                  customers
                </span>

              </label>

            </div>

            {/* =================================================
                SAVE BUTTON
            ================================================= */}

            <button
              type="submit"
              className="save-btn"
              disabled={
                loading ||
                uploadingImage ||
                productsLoading ||
                products.length === 0
              }
            >
              {loading ||
              uploadingImage
                ? "Saving..."
                : editingId
                ? "Update Daily Product"
                : "Add Daily Product"}
            </button>

          </form>
        </div>

        {/* =================================================
            DAILY PRODUCT LIST
        ================================================= */}

        <div className="inventory-card">

          <div className="list-header">

            <div>
              <h2>
                Daily Products
              </h2>

              <p>
                Inventory for{" "}
                {form.date}
              </p>
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={
                fetchDailyProducts
              }
            >
              Refresh
            </button>

          </div>

          {/* EMPTY */}

          {dailyProducts.length === 0 ? (
            <div className="empty-state">

              <h3>
                No daily products
              </h3>

              <p>
                No products have
                been added for this
                date.
              </p>

            </div>
          ) : (

            /* =================================================
               TABLE
            ================================================= */

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>
                      Image
                    </th>

                    <th>
                      Product
                    </th>

                    <th>
                      Dish / Variety
                    </th>

                    <th>
                      Rate
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Stock
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {dailyProducts.map(
                    (item) => (

                      <tr
                        key={item._id}
                      >

                        {/* IMAGE */}

                        <td>

                          {item.image ? (

                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.variety ||
                                "Daily product"
                              }
                              className="daily-product-image"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";

                                const parent =
                                  e.currentTarget
                                    .parentElement;

                                if (
                                  parent &&
                                  !parent.querySelector(
                                    ".image-error-text"
                                  )
                                ) {
                                  const span =
                                    document.createElement(
                                      "span"
                                    );

                                  span.className =
                                    "image-error-text";

                                  span.textContent =
                                    "Image unavailable";

                                  parent.appendChild(
                                    span
                                  );
                                }
                              }}
                            />

                          ) : (

                            <div className="no-image">
                              No Image
                            </div>

                          )}

                        </td>

                        {/* PRODUCT */}

                        <td className="product-name-cell">

                          {item.product?.name ||
                            "Unknown Product"}

                        </td>

                        {/* VARIETY */}

                        <td>
                          {item.variety ||
                            "-"}
                        </td>

                        {/* RATE */}

                        <td className="rate-cell">
                          {item.rate ||
                            "-"}
                        </td>

                        {/* AVAILABLE QUANTITY */}

                        <td>
                          {item.availableQuantity ||
                            "-"}
                        </td>

                        {/* STOCK */}

                        <td>
                          {item.stockQuantity ??
                            0}
                        </td>

                        {/* STATUS */}

                        <td>

                          <button
                            type="button"
                            className={
                              item.isAvailable
                                ? "status available"
                                : "status unavailable"
                            }
                            onClick={() =>
                              toggleAvailability(
                                item
                              )
                            }
                          >
                            {item.isAvailable
                              ? "Available"
                              : "Unavailable"}
                          </button>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                handleEdit(
                                  item
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  item._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default DailyInventory;