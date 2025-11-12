/* eslint-disable no-console */
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const validator = require("validator");
require("dotenv").config();

const app = express();

// Environment variables
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/blood";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// ✅ CORS Configuration (allows your GitHub Pages domain)
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    if (!origin || allowed.includes(origin) || allowed.includes("*")) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  }
};

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));

// ✅ Donor Schema
const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 18, max: 65 },
    phoneNumber: {
      type: String,
      required: true,
      validate: { validator: (v) => /^\d{10}$/.test(v), message: "Invalid phone" }
    },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    country: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    notes: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

const Donor = mongoose.model("Donor", donorSchema);

// ✅ Health Route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "LifePulse API running" });
});

// ✅ Create Donor Route
app.post("/api/donations", async (req, res) => {
  try {
    const donor = await Donor.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Donor registered successfully",
      donorId: donor._id
    });
  } catch (error) {
    console.error("[LifePulse] Error:", error);
    res.status(400).json({
      status: "error",
      message: error.message || "Validation failed"
    });
  }
});

// ✅ Fetch Donors by Blood Group
app.get("/api/donations", async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup.toUpperCase())) {
      return res.status(422).json({ status: "error", message: "Invalid blood group" });
    }

    const donors = await Donor.find({ bloodGroup: bloodGroup.toUpperCase() })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ status: "success", donors });
  } catch (error) {
    console.error("[LifePulse] Query failed:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ✅ Connect MongoDB and Start Server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[LifePulse] Connected to MongoDB");
    app.listen(PORT, () => console.log(`[LifePulse] Listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[LifePulse] MongoDB connection failed:", err);
    process.exit(1);
  });
