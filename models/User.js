const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["principal", "teacher"] },
    assignedClass: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
