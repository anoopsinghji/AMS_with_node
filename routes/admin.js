const express = require("express");
const bcrypt = require("bcryptjs");
const { authenticateToken, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const Student = require("../models/Student");
const Schedule = require("../models/Schedule");
const Attendance = require("../models/Attendance");

const router = express.Router();

router.use(authenticateToken, requireRole("principal"));

function isValidTimeFormat(time) {
  if (!time || typeof time !== "string") return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

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

  try {
    const existingUser = await User.findOne({ id }).lean();
    if (existingUser) {
      return res.status(409).json({ error: "Teacher ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      id,
      name,
      email: email || "",
      phone: phone || "",
      password: hashedPassword,
      role: "teacher",
      assignedClass: assignedClass || "",
    });

    return res.status(201).json({ message: "Teacher registered successfully", teacherId: id });
  } catch (error) {
    console.error("Register teacher error:", error.message);
    return res.status(500).json({ error: "Could not save teacher" });
  }
});

router.post("/add-student", async (req, res) => {
  const { id, name, className, email, phone, dateOfBirth, address, parentName, parentPhone } = req.body;

  if (!id || !name || !className) {
    return res.status(400).json({ error: "id, name and className are required" });
  }

  try {
    const existingStudent = await Student.findOne({ id }).lean();
    if (existingStudent) {
      return res.status(409).json({ error: "Student already exists" });
    }

    await Student.create({
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
    });

    return res.status(201).json({ message: "Student added successfully" });
  } catch (error) {
    console.error("Add student error:", error.message);
    return res.status(500).json({ error: "Could not save student" });
  }
});

router.post("/assign-class", async (req, res) => {
  const { teacherId, className } = req.body;

  if (!teacherId || !className) {
    return res.status(400).json({ error: "teacherId and className are required" });
  }

  try {
    const teacher = await User.findOne({ id: teacherId, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    teacher.assignedClass = className;
    await teacher.save();

    return res.json({ message: "Class assigned", teacherId, className });
  } catch (error) {
    console.error("Assign class error:", error.message);
    return res.status(500).json({ error: "Could not save teacher assignment" });
  }
});

router.get("/teachers", async (_req, res) => {
  try {
    const [teachers, attendanceRecords] = await Promise.all([
      User.find({ role: "teacher" })
        .select("id name email phone assignedClass -_id")
        .lean(),
      Attendance.find()
        .select("teacherId present absent presentStudents absentStudents -_id")
        .lean(),
    ]);

    const attendanceByTeacher = attendanceRecords.reduce((acc, record) => {
      const teacherId = record.teacherId;
      if (!teacherId) return acc;

      if (!acc[teacherId]) {
        acc[teacherId] = { sessionsMarked: 0, presentCount: 0, absentCount: 0 };
      }

      const presentCount = Array.isArray(record.present)
        ? record.present.length
        : Array.isArray(record.presentStudents)
          ? record.presentStudents.length
          : 0;
      const absentCount = Array.isArray(record.absent)
        ? record.absent.length
        : Array.isArray(record.absentStudents)
          ? record.absentStudents.length
          : 0;

      acc[teacherId].sessionsMarked += 1;
      acc[teacherId].presentCount += presentCount;
      acc[teacherId].absentCount += absentCount;

      return acc;
    }, {});

    const enrichedTeachers = teachers.map((teacher) => {
      const perf = attendanceByTeacher[teacher.id] || {
        sessionsMarked: 0,
        presentCount: 0,
        absentCount: 0,
      };
      const totalMarked = perf.presentCount + perf.absentCount;
      const attendanceRate = totalMarked > 0
        ? Number(((perf.presentCount / totalMarked) * 100).toFixed(1))
        : 0;

      return {
        ...teacher,
        sessionsMarked: perf.sessionsMarked,
        presentCount: perf.presentCount,
        absentCount: perf.absentCount,
        attendanceRate,
      };
    });

    return res.json({ teachers: enrichedTeachers });
  } catch (error) {
    console.error("Get teachers error:", error.message);
    return res.status(500).json({ error: "Could not fetch teachers" });
  }
});

router.get("/classes", async (_req, res) => {
  try {
    const classes = await Student.distinct("class");
    const uniqueClasses = classes.filter(Boolean).sort();
    return res.json({ classes: uniqueClasses });
  } catch (error) {
    console.error("Get classes error:", error.message);
    return res.status(500).json({ error: "Could not fetch classes" });
  }
});

router.get("/students-by-class/:className", async (req, res) => {
  const { className } = req.params;

  try {
    const classStudents = await Student.find({ class: className })
      .select("id name email phone -_id")
      .lean();

    return res.json({ className, students: classStudents, count: classStudents.length });
  } catch (error) {
    console.error("Get students by class error:", error.message);
    return res.status(500).json({ error: "Could not fetch students" });
  }
});

router.post("/create-schedule", async (req, res) => {
  const { teacherId, className, subject, startTime, endTime, day } = req.body;

  if (!teacherId || !className || !subject || !startTime || !endTime || !day) {
    return res.status(400).json({ error: "All fields (teacherId, className, subject, startTime, endTime, day) are required" });
  }

  if (!isValidTimeFormat(startTime)) {
    return res.status(400).json({ error: "Invalid start time format. Please use HH:MM format (e.g., 09:30)" });
  }

  if (!isValidTimeFormat(endTime)) {
    return res.status(400).json({ error: "Invalid end time format. Please use HH:MM format (e.g., 10:30)" });
  }

  if (compareTime(startTime, endTime) >= 0) {
    return res.status(400).json({ error: "Start time must be before end time" });
  }

  try {
    const teacher = await User.findOne({ id: teacherId, role: "teacher" }).lean();
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const hasStudents = await Student.exists({ class: className });
    if (!hasStudents) {
      return res.status(404).json({ error: "Class has no students" });
    }

    const scheduleId = `SCH${Date.now()}`;

    await Schedule.create({
      id: scheduleId,
      teacherId,
      className,
      subject,
      startTime,
      endTime,
      day,
      createdDate: new Date().toISOString().slice(0, 10),
    });

    return res.status(201).json({ message: "Schedule created", scheduleId });
  } catch (error) {
    console.error("Create schedule error:", error.message);
    return res.status(500).json({ error: "Could not save schedule" });
  }
});

router.get("/schedules", async (_req, res) => {
  try {
    const schedules = await Schedule.find().select("-__v -_id").lean();
    return res.json({ schedules });
  } catch (error) {
    console.error("Get schedules error:", error.message);
    return res.status(500).json({ error: "Could not fetch schedules" });
  }
});

router.get("/teacher-schedule/:teacherId", async (req, res) => {
  const { teacherId } = req.params;

  try {
    const schedules = await Schedule.find({ teacherId }).select("-__v -_id").lean();
    return res.json({ teacherId, schedules });
  } catch (error) {
    console.error("Get teacher schedule error:", error.message);
    return res.status(500).json({ error: "Could not fetch teacher schedule" });
  }
});

router.get("/class-schedule/:className", async (req, res) => {
  const { className } = req.params;

  try {
    const schedules = await Schedule.find({ className }).select("-__v -_id").lean();
    return res.json({ className, schedules });
  } catch (error) {
    console.error("Get class schedule error:", error.message);
    return res.status(500).json({ error: "Could not fetch class schedule" });
  }
});

router.delete("/schedule/:scheduleId", async (req, res) => {
  const { scheduleId } = req.params;

  try {
    const result = await Schedule.deleteOne({ id: scheduleId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.json({ message: "Schedule deleted" });
  } catch (error) {
    console.error("Delete schedule error:", error.message);
    return res.status(500).json({ error: "Could not delete schedule" });
  }
});

router.get("/all-students", async (_req, res) => {
  try {
    const students = await Student.find().select("-__v -_id").lean();
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
  } catch (error) {
    console.error("Get all students error:", error.message);
    return res.status(500).json({ error: "Could not fetch students" });
  }
});

router.get("/attendance-summary", async (_req, res) => {
  try {
    const attendance = await Attendance.find().select("-__v -_id").lean();
    const schedule = await Schedule.find().select("id className teacherId subject -_id").lean();
    const scheduleMap = new Map(schedule.map((s) => [s.id, s]));

    const attendanceSummary = attendance.map((record) => {
      const scheduleRecord = record.scheduleId ? scheduleMap.get(record.scheduleId) : null;
      const presentCount = Array.isArray(record.present)
        ? record.present.length
        : Array.isArray(record.presentStudents)
          ? record.presentStudents.length
          : 0;
      const absentCount = Array.isArray(record.absent)
        ? record.absent.length
        : Array.isArray(record.absentStudents)
          ? record.absentStudents.length
          : 0;

      return {
        date: record.date || new Date().toISOString().slice(0, 10),
        className: scheduleRecord?.className || record.class || "Unknown",
        teacherId: scheduleRecord?.teacherId || record.teacherId || "Unknown",
        subject: scheduleRecord?.subject || record.subject || "Unknown",
        present: presentCount,
        absent: absentCount,
        total: presentCount + absentCount,
      };
    });

    return res.json({ attendance: attendanceSummary });
  } catch (error) {
    console.error("Attendance summary error:", error.message);
    return res.status(500).json({ error: "Could not fetch attendance summary" });
  }
});

router.get("/attendance-stats", async (_req, res) => {
  try {
    const attendance = await Attendance.find().select("present absent presentStudents absentStudents -_id").lean();

    let totalPresent = 0;
    let totalAbsent = 0;

    attendance.forEach((record) => {
      const presentCount = Array.isArray(record.present)
        ? record.present.length
        : Array.isArray(record.presentStudents)
          ? record.presentStudents.length
          : 0;
      const absentCount = Array.isArray(record.absent)
        ? record.absent.length
        : Array.isArray(record.absentStudents)
          ? record.absentStudents.length
          : 0;

      totalPresent += presentCount;
      totalAbsent += absentCount;
    });

    return res.json({
      stats: {
        present: totalPresent,
        absent: totalAbsent,
        total: totalPresent + totalAbsent,
      },
    });
  } catch (error) {
    console.error("Attendance stats error:", error.message);
    return res.status(500).json({ error: "Could not fetch attendance stats" });
  }
});

module.exports = router;
