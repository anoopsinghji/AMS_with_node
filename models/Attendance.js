const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    teacherId: { type: String, required: true, trim: true },
    scheduleId: { type: String, default: null },
    subject: { type: String, default: null },
    timeSlot: { type: String, default: null },
    present: { type: [String], default: [] },
    absent: { type: [String], default: [] },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { date: 1, class: 1, teacherId: 1, scheduleId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
