const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { readJson, writeJson } = require("../utils/fileStore");

const router = express.Router();

router.use(authenticateToken, requireRole("teacher"));

function normalizeDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

router.get("/my-class", (req, res) => {
  const users = readJson("users.json", []);
  const students = readJson("students.json", []);

  const teacher = users.find(
    (user) => user.id === req.user.id && user.role === "teacher"
  );

  if (!teacher || !teacher.assignedClass) {
    return res.status(404).json({ error: "No class assigned" });
  }

  const classStudents = students.filter(
    (student) => student.class === teacher.assignedClass
  );

  return res.json({
    className: teacher.assignedClass,
    students: classStudents,
  });
});

router.get("/my-schedule", (req, res) => {
  const schedule = readJson("schedule.json", []);
  const teacherSchedule = schedule.filter((s) => s.teacherId === req.user.id);

  return res.json({ schedules: teacherSchedule });
});

router.get("/schedule/:scheduleId/students", (req, res) => {
  const { scheduleId } = req.params;
  const schedule = readJson("schedule.json", []);
  const scheduleItem = schedule.find((s) => s.id === scheduleId);

  if (!scheduleItem) {
    return res.status(404).json({ error: "Schedule not found" });
  }

  if (scheduleItem.teacherId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const students = readJson("students.json", []);
  const classStudents = students.filter((s) => s.class === scheduleItem.className);

  return res.json({
    scheduleId,
    className: scheduleItem.className,
    subject: scheduleItem.subject,
    time: `${scheduleItem.startTime} - ${scheduleItem.endTime}`,
    students: classStudents,
  });
});

router.post("/submit-attendance", (req, res) => {
  const { presentIds = [], date, scheduleId } = req.body;

  if (!Array.isArray(presentIds)) {
    return res.status(400).json({ error: "presentIds must be an array" });
  }

  const users = readJson("users.json", []);
  const students = readJson("students.json", []);
  const attendance = readJson("attendance.json", []);
  const schedule = readJson("schedule.json", []);

  const teacher = users.find(
    (user) => user.id === req.user.id && user.role === "teacher"
  );

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
    const scheduleItem = schedule.find((s) => s.id === scheduleId);
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

  const validStudentIds = new Set(
    students
      .filter((student) => student.class === className)
      .map((student) => student.id)
  );

  for (const studentId of presentIds) {
    if (!validStudentIds.has(studentId)) {
      return res.status(400).json({
        error: `Student ${studentId} does not belong to ${className}`,
      });
    }
  }

  const uniquePresentIds = [...new Set(presentIds)];
  const uniqueAbsentIds = [...validStudentIds].filter((id) => !presentIds.includes(id));

  const existingIndex = attendance.findIndex(
    (row) =>
      row.date === attendanceDate &&
      row.class === className &&
      row.teacherId === teacher.id &&
      row.scheduleId === (scheduleId || null)
  );

  const record = {
    date: attendanceDate,
    class: className,
    teacherId: teacher.id,
    scheduleId: scheduleId || null,
    subject: subject || null,
    timeSlot: timeSlot || null,
    present: uniquePresentIds,
    absent: uniqueAbsentIds,
  };

  if (existingIndex >= 0) {
    attendance[existingIndex] = record;
  } else {
    attendance.push(record);
  }

  const saved = writeJson("attendance.json", attendance);
  if (!saved) {
    return res.status(500).json({ error: "Could not save attendance" });
  }

  return res.status(201).json({ message: "Attendance submitted", record });
});

module.exports = router;
