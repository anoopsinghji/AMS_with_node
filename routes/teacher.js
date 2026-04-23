const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const Student = require("../models/Student");
const Schedule = require("../models/Schedule");
const Attendance = require("../models/Attendance");

const router = express.Router();

router.use(authenticateToken, requireRole("teacher"));

function normalizeDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

router.get("/my-class", async (req, res) => {
  try {
    const teacher = await User.findOne({ id: req.user.id, role: "teacher" }).lean();

    if (!teacher || !teacher.assignedClass) {
      return res.status(404).json({ error: "No class assigned" });
    }

    const students = await Student.find({ class: teacher.assignedClass }).select("-__v -_id").lean();

    return res.json({
      className: teacher.assignedClass,
      students,
    });
  } catch (error) {
    console.error("My class error:", error.message);
    return res.status(500).json({ error: "Could not fetch class data" });
  }
});

router.get("/my-schedule", async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacherId: req.user.id }).select("-__v -_id").lean();
    return res.json({ schedules });
  } catch (error) {
    console.error("My schedule error:", error.message);
    return res.status(500).json({ error: "Could not fetch schedule" });
  }
});

router.get("/schedule/:scheduleId/students", async (req, res) => {
  const { scheduleId } = req.params;

  try {
    const scheduleItem = await Schedule.findOne({ id: scheduleId }).lean();

    if (!scheduleItem) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    if (scheduleItem.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const students = await Student.find({ class: scheduleItem.className }).select("-__v -_id").lean();

    return res.json({
      scheduleId,
      className: scheduleItem.className,
      subject: scheduleItem.subject,
      time: `${scheduleItem.startTime} - ${scheduleItem.endTime}`,
      students,
    });
  } catch (error) {
    console.error("Schedule students error:", error.message);
    return res.status(500).json({ error: "Could not fetch schedule students" });
  }
});

router.post("/submit-attendance", async (req, res) => {
  const { presentIds = [], date, scheduleId } = req.body;

  if (!Array.isArray(presentIds)) {
    return res.status(400).json({ error: "presentIds must be an array" });
  }

  try {
    const teacher = await User.findOne({ id: req.user.id, role: "teacher" }).lean();

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const attendanceDate = normalizeDate(date);
    if (!attendanceDate) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (attendanceDate > today) {
      return res.status(400).json({ error: "Future attendance is not allowed" });
    }

    let className = "";
    let subject = "";
    let timeSlot = "";

    if (scheduleId) {
      const scheduleItem = await Schedule.findOne({ id: scheduleId }).lean();
      if (!scheduleItem || scheduleItem.teacherId !== teacher.id) {
        return res.status(403).json({ error: "Unauthorized schedule" });
      }
      className = scheduleItem.className;
      subject = scheduleItem.subject;
      timeSlot = `${scheduleItem.startTime}-${scheduleItem.endTime}`;
    } else if (teacher.assignedClass) {
      className = teacher.assignedClass;
    } else {
      return res.status(400).json({ error: "No assigned class or schedule" });
    }

    const classStudents = await Student.find({ class: className }).select("id -_id").lean();
    const validStudentIds = new Set(classStudents.map((student) => student.id));

    for (const studentId of presentIds) {
      if (!validStudentIds.has(studentId)) {
        return res.status(400).json({
          error: `Student ${studentId} does not belong to ${className}`,
        });
      }
    }

    const uniquePresentIds = [...new Set(presentIds)];
    const uniqueAbsentIds = [...validStudentIds].filter((id) => !uniquePresentIds.includes(id));

    const filter = {
      date: attendanceDate,
      class: className,
      teacherId: teacher.id,
      scheduleId: scheduleId || null,
    };

    const record = {
      ...filter,
      subject: subject || null,
      timeSlot: timeSlot || null,
      present: uniquePresentIds,
      absent: uniqueAbsentIds,
    };

    await Attendance.findOneAndUpdate(filter, record, { upsert: true, new: true, setDefaultsOnInsert: true });

    return res.status(201).json({ message: "Attendance submitted", record });
  } catch (error) {
    console.error("Submit attendance error:", error.message);
    return res.status(500).json({ error: "Could not save attendance" });
  }
});

module.exports = router;
