const express = require("express");
const bcrypt = require("bcryptjs");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { readJson, writeJson } = require("../utils/fileStore");

const router = express.Router();

router.use(authenticateToken, requireRole("principal"));

// Helper function to validate time format (HH:MM)
function isValidTimeFormat(time) {
  if (!time || typeof time !== "string") return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Helper function to compare times (returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2)
function compareTime(time1, time2) {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);
  
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  
  if (minutes1 < minutes2) return -1;
  if (minutes1 > minutes2) return 1;
  return 0;
}

router.post("/register-teacher", async (req, res) => {
  const { id, name, email, phone, password, assignedClass } = req.body;

  if (!id || !name || !password) {
    return res.status(400).json({ error: "id, name and password are required" });
  }

  const users = readJson("users.json", []);
  if (users.some((user) => user.id === id)) {
    return res.status(409).json({ error: "Teacher ID already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newTeacher = {
    id,
    name,
    email: email || "",
    phone: phone || "",
    password: hashedPassword,
    role: "teacher",
    assignedClass: assignedClass || "",
  };

  users.push(newTeacher);
  const saved = writeJson("users.json", users);
  if (!saved) {
    return res.status(500).json({ error: "Could not save teacher" });
  }

  return res.status(201).json({ message: "Teacher registered successfully", teacherId: id });
});

router.post("/add-student", (req, res) => {
  const { id, name, className, email, phone, dateOfBirth, address, parentName, parentPhone } = req.body;

  if (!id || !name || !className) {
    return res.status(400).json({ error: "id, name and className are required" });
  }

  const students = readJson("students.json", []);
  if (students.some((student) => student.id === id)) {
    return res.status(409).json({ error: "Student already exists" });
  }

  const newStudent = {
    id,
    name,
    class: className,
    email: email || "",
    phone: phone || "",
    dateOfBirth: dateOfBirth || "",
    address: address || "",
    parentName: parentName || "",
    parentPhone: parentPhone || "",
    admissionDate: new Date().toISOString().slice(0, 10),
  };

  students.push(newStudent);

  const saved = writeJson("students.json", students);
  if (!saved) {
    return res.status(500).json({ error: "Could not save student" });
  }

  return res.status(201).json({ message: "Student added successfully" });
});

router.post("/assign-class", (req, res) => {
  const { teacherId, className } = req.body;

  if (!teacherId || !className) {
    return res.status(400).json({ error: "teacherId and className are required" });
  }

  const users = readJson("users.json", []);
  const teacher = users.find(
    (user) => user.id === teacherId && user.role === "teacher"
  );

  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  teacher.assignedClass = className;

  const saved = writeJson("users.json", users);
  if (!saved) {
    return res.status(500).json({ error: "Could not save teacher assignment" });
  }

  return res.json({ message: "Class assigned", teacherId, className });
});

router.get("/teachers", (_req, res) => {
  const users = readJson("users.json", []);
  const teachers = users
    .filter((user) => user.role === "teacher")
    .map((teacher) => ({
      id: teacher.id,
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      assignedClass: teacher.assignedClass || "",
    }));

  return res.json({ teachers });
});

router.get("/classes", (_req, res) => {
  const students = readJson("students.json", []);
  const uniqueClasses = [...new Set(students.map((s) => s.class))].sort();
  return res.json({ classes: uniqueClasses });
});

router.get("/students-by-class/:className", (req, res) => {
  const { className } = req.params;
  const students = readJson("students.json", []);
  const classStudents = students
    .filter((s) => s.class === className)
    .map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email || "",
      phone: s.phone || "",
    }));

  return res.json({ className, students: classStudents, count: classStudents.length });
});

router.post("/create-schedule", (req, res) => {
  const { teacherId, className, subject, startTime, endTime, day } = req.body;

  if (!teacherId || !className || !subject || !startTime || !endTime || !day) {
    return res.status(400).json({ error: "All fields (teacherId, className, subject, startTime, endTime, day) are required" });
  }

  // Validate time format
  if (!isValidTimeFormat(startTime)) {
    return res.status(400).json({ error: "Invalid start time format. Please use HH:MM format (e.g., 09:30)" });
  }

  if (!isValidTimeFormat(endTime)) {
    return res.status(400).json({ error: "Invalid end time format. Please use HH:MM format (e.g., 10:30)" });
  }

  // Validate that start time is before end time
  if (compareTime(startTime, endTime) >= 0) {
    return res.status(400).json({ error: "Start time must be before end time" });
  }

  const users = readJson("users.json", []);
  const teacher = users.find((u) => u.id === teacherId && u.role === "teacher");
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  const students = readJson("students.json", []);
  if (!students.some((s) => s.class === className)) {
    return res.status(404).json({ error: "Class has no students" });
  }

  const schedule = readJson("schedule.json", []);
  const scheduleId = `SCH${Date.now()}`;
  
  schedule.push({
    id: scheduleId,
    teacherId,
    className,
    subject,
    startTime,
    endTime,
    day,
    createdDate: new Date().toISOString().slice(0, 10),
  });

  const saved = writeJson("schedule.json", schedule);
  if (!saved) {
    return res.status(500).json({ error: "Could not save schedule" });
  }

  return res.status(201).json({ message: "Schedule created", scheduleId });
});

router.get("/schedules", (_req, res) => {
  const schedule = readJson("schedule.json", []);
  return res.json({ schedules: schedule });
});

router.get("/teacher-schedule/:teacherId", (req, res) => {
  const { teacherId } = req.params;
  const schedule = readJson("schedule.json", []);
  const teacherSchedule = schedule.filter((s) => s.teacherId === teacherId);

  return res.json({ teacherId, schedules: teacherSchedule });
});

router.get("/class-schedule/:className", (req, res) => {
  const { className } = req.params;
  const schedule = readJson("schedule.json", []);
  const classSchedule = schedule.filter((s) => s.className === className);

  return res.json({ className, schedules: classSchedule });
});

router.delete("/schedule/:scheduleId", (req, res) => {
  const { scheduleId } = req.params;
  const schedule = readJson("schedule.json", []);
  const filteredSchedule = schedule.filter((s) => s.id !== scheduleId);

  if (filteredSchedule.length === schedule.length) {
    return res.status(404).json({ error: "Schedule not found" });
  }

  const saved = writeJson("schedule.json", filteredSchedule);
  if (!saved) {
    return res.status(500).json({ error: "Could not delete schedule" });
  }

  return res.json({ message: "Schedule deleted" });
});

// ============================================
// New Endpoints for Dashboard Analytics
// ============================================

router.get("/all-students", (_req, res) => {
  const students = readJson("students.json", []);
  const formattedStudents = students.map((s) => ({
    id: s.id,
    name: s.name,
    className: s.class,
    email: s.email || "",
    phone: s.phone || "",
    parentName: s.parentName || "",
    admissionDate: s.admissionDate || new Date().toISOString().slice(0, 10),
  }));

  return res.json({ students: formattedStudents });
});

router.get("/attendance-summary", (_req, res) => {
  const attendance = readJson("attendance.json", []);
  const schedule = readJson("schedule.json", []);
  const users = readJson("users.json", []);
  const students = readJson("students.json", []);

  // Build attendance summary from attendance records
  const attendanceSummary = attendance.map((record) => {
    const scheduleRecord = schedule.find((s) => s.id === record.scheduleId);
    const teacher = users.find((u) => u.id === scheduleRecord?.teacherId);

    return {
      date: record.date || new Date().toISOString().slice(0, 10),
      className: scheduleRecord?.className || "Unknown",
      teacherId: scheduleRecord?.teacherId || "Unknown",
      subject: scheduleRecord?.subject || "Unknown",
      present: record.presentStudents?.length || 0,
      absent: record.absentStudents?.length || 0,
      total: (record.presentStudents?.length || 0) + (record.absentStudents?.length || 0),
    };
  });

  return res.json({ attendance: attendanceSummary });
});

router.get("/attendance-stats", (_req, res) => {
  const attendance = readJson("attendance.json", []);

  let totalPresent = 0;
  let totalAbsent = 0;

  attendance.forEach((record) => {
    totalPresent += record.presentStudents?.length || 0;
    totalAbsent += record.absentStudents?.length || 0;
  });

  return res.json({
    stats: {
      present: totalPresent,
      absent: totalAbsent,
      total: totalPresent + totalAbsent,
    },
  });
});

module.exports = router;
