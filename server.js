/* eslint-disable no-console */
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const validator = require("validator");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/blood";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      // Allow requests from tools such as curl or same-origin
      return callback(null, true);
    }
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  }
};

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));

const donorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"]
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Donors must be at least 18 years old"],
      max: [65, "Donors must be below 66 years old"]
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: (value) => /^\d{10}$/.test(value),
        message: "Phone number must be a valid 10-digit number"
      }
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      uppercase: true,
      enum: {
        values: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        message: "{VALUE} is not a supported blood group"
      }
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"]
    }
  },
  {
    timestamps: true
  }
);

donorSchema.index({ createdAt: -1 });
const Donor = mongoose.model("Donor", donorSchema);

const validatePayload = (payload) => {
  const errors = [];
  const requiredFields = [
    "name",
    "age",
    "phoneNumber",
    "bloodGroup",
    "country",
    "state",
    "district",
    "city"
  ];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      errors.push(`${field} is required`);
    }
  });

  if (payload.name && payload.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  const ageNumber = Number(payload.age);
  if (Number.isNaN(ageNumber)) {
    errors.push("Age must be a number");
  } else if (ageNumber < 18 || ageNumber > 65) {
    errors.push("Age must be between 18 and 65");
  }

  if (payload.phoneNumber && !/^\d{10}$/.test(payload.phoneNumber)) {
    errors.push("Phone number must be a valid 10-digit number");
  }

  if (payload.country && !validator.isLength(payload.country.trim(), { min: 2 })) {
    errors.push("Country must be at least 2 characters long");
  }
  if (payload.state && !validator.isLength(payload.state.trim(), { min: 2 })) {
    errors.push("State must be at least 2 characters long");
  }
  if (payload.district && !validator.isLength(payload.district.trim(), { min: 2 })) {
    errors.push("District must be at least 2 characters long");
  }
  if (payload.city && !validator.isLength(payload.city.trim(), { min: 2 })) {
    errors.push("City must be at least 2 characters long");
  }

  if (
    payload.bloodGroup &&
    !BLOOD_GROUPS.includes(payload.bloodGroup.toUpperCase())
  ) {
    errors.push("Invalid blood group supplied");
  }

  if (payload.notes && payload.notes.length > 500) {
    errors.push("Notes cannot exceed 500 characters");
  }

  return errors;
};

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LifePulse API is running",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/donations", async (req, res) => {
  const payload = req.body ?? {};
  const validationErrors = validatePayload(payload);

  if (validationErrors.length) {
    return res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors: validationErrors
    });
  }

  try {
    const donor = await Donor.create({
      name: payload.name.trim(),
      age: Number(payload.age),
      phoneNumber: payload.phoneNumber.trim(),
      bloodGroup: payload.bloodGroup.toUpperCase(),
      country: payload.country.trim(),
      state: payload.state.trim(),
      district: payload.district.trim(),
      city: payload.city.trim(),
      notes: payload.notes ? payload.notes.trim() : undefined
    });

    return res.status(201).json({
      status: "success",
      message: "Donor profile created successfully",
      donorId: donor._id
    });
  } catch (error) {
    console.error("[LifePulse] Failed to create donor:", error);
    return res.status(500).json({
      status: "error",
      message: "We were unable to save your details. Please try again shortly."
    });
  }
});

app.get("/api/donations", async (req, res) => {
  const { bloodGroup } = req.query;

  if (!bloodGroup) {
    return res.status(400).json({
      status: "error",
      message: "Blood group query parameter is required"
    });
  }

  const normalizedGroup = String(bloodGroup).toUpperCase();

  if (!BLOOD_GROUPS.includes(normalizedGroup)) {
    return res.status(422).json({
      status: "error",
      message: "Invalid blood group supplied"
    });
  }

  try {
    const donors = await Donor.find({ bloodGroup: normalizedGroup })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name age city state bloodGroup createdAt");

    return res.status(200).json({
      status: "success",
      donors
    });
  } catch (error) {
    console.error("[LifePulse] Failed to query donors:", error);
    return res.status(500).json({
      status: "error",
      message: "Unable to fetch donors at this time. Please try again shortly."
    });
  }
});

mongoose
  .connect(MONGO_URI, {
    autoIndex: true
  })
  .then(() => {
    console.log("[LifePulse] Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`[LifePulse] API listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[LifePulse] MongoDB connection failed:", error);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("\n[LifePulse] MongoDB connection closed. Goodbye!");
  process.exit(0);
});

