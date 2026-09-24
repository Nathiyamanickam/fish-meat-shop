const multer = require("multer");

// ======================================================
// MEMORY STORAGE
// ======================================================

const storage = multer.memoryStorage();

// ======================================================
// MULTER CONFIG
// ======================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed"
        )
      );
    }
  },
});

// ======================================================
// IMAGE UPLOAD MIDDLEWARE
// FIELD NAME MUST BE "image"
// ======================================================

const uploadProductImageFile = (
  req,
  res,
  next
) => {
  upload.single("image")(
    req,
    res,
    (error) => {
      if (error) {
        console.error(
          "MULTER IMAGE ERROR:",
          error
        );

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "Image upload failed",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select an image",
        });
      }

      console.log(
        "IMAGE RECEIVED:",
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );

      next();
    }
  );
};

module.exports = {
  uploadProductImageFile,
};