const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    dateOfBirth: { type: String, default: "" },
    address: { type: String, default: "" },
    parentName: { type: String, default: "", trim: true },
    parentPhone: { type: String, default: "", trim: true },
    admissionDate: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
