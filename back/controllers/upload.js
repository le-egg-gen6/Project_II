const uploadRouter = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and documents
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, PDFs, and documents are allowed."
      )
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Upload single file
uploadRouter.post("/", upload.single("file"), async (request, response) => {
  const token = getTokenFrom(request);

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    if (!request.file) {
      return response.status(400).json({ error: "No file uploaded" });
    }

    const fileData = {
      id: request.file.filename,
      name: request.file.originalname,
      size: request.file.size,
      type: request.file.mimetype,
      url: `/uploads/${request.file.filename}`,
      uploadedBy: decodedToken.id,
      uploadedAt: new Date(),
    };

    response.json(fileData);
  } catch (error) {
    console.error("Upload error:", error);
    if (error.message.includes("Invalid file type")) {
      response.status(400).json({ error: error.message });
    } else {
      response.status(500).json({ error: "Upload failed" });
    }
  }
});

// Serve uploaded files
uploadRouter.get("/:filename", (request, response) => {
  const filename = request.params.filename;
  const filepath = path.join(uploadsDir, filename);

  if (fs.existsSync(filepath)) {
    response.sendFile(path.resolve(filepath));
  } else {
    response.status(404).json({ error: "File not found" });
  }
});

module.exports = uploadRouter;
