import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/public/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter (only images + pdf allowed)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (!ext) {
    cb(new Error("Only images and PDFs are allowed"));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export default upload;