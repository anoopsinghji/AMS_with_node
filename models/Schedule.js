const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    teacherId: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    day: { type: String, required: true, trim: true },
    createdDate: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
