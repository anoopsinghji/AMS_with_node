const token = localStorage.getItem("ams_token");
const role = localStorage.getItem("ams_role");

const messageEl = document.getElementById("message");
const createTeacherForm = document.getElementById("createTeacherForm");
const addStudentForm = document.getElementById("addStudentForm");
const createScheduleForm = document.getElementById("createScheduleForm");
const schedTeacherSelect = document.getElementById("schedTeacherId");
const schedClassSelect = document.getElementById("schedClassName");
const teacherList = document.getElementById("teacherList");
const scheduleList = document.getElementById("scheduleList");

// Chart instances for memory management
let classAttendanceChartInstance = null;
let teacherPerformanceChartInstance = null;
let attendanceDataTable = null;
let studentDataTable = null;

// Toastr configuration
toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: "toast-top-right",
  preventDuplicates: false,
  onclick: null,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "5000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
};

if (!token || role !== "principal") {
  window.location.href = "/";
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function showMessage(text, ok = false) {
  if (ok) {
    toastr.success(text, "Success!", { timeOut: 3000 });
  } else {
    toastr.error(text, "Error!", { timeOut: 4000 });
  }
}

async function loadTeachers() {
  const response = await fetch("/api/admin/teachers", { headers: headers() });
  const data = await response.json();

  teacherList.innerHTML = "";
  
  // Populate the schedule dropdown
  schedTeacherSelect.innerHTML = '<option value="">-- Select teacher --</option>';
  
  if (!response.ok) {
    showMessage(data.error || "Unable to load teachers");
    return;
  }

  if (data.teachers.length === 0) {
    teacherList.innerHTML = "<li style=\"text-align: center; color: var(--text-light);\">No teachers found</li>";
    return;
  }

  data.teachers.forEach((teacher) => {
    // Add to teachers list
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${teacher.id}</strong> - ${teacher.name || "Unnamed"}
      <div style="color: var(--text-light); font-size: 12px; margin-top: 6px; line-height: 1.6;">
        ${teacher.email ? ` ${teacher.email}` : ""} ${teacher.email && teacher.phone ? " | " : ""}
        ${teacher.phone ? ` ${teacher.phone}` : ""}
        <br />
        Class: <strong>${teacher.assignedClass || "Not assigned"}</strong>
      </div>
    `;
    teacherList.appendChild(item);

    // Add to schedule dropdown
    const option = document.createElement("option");
    option.value = teacher.id;
    option.textContent = `${teacher.id} - ${teacher.name || "Unnamed"}`;
    schedTeacherSelect.appendChild(option);
  });
}

async function loadClasses() {
  const response = await fetch("/api/admin/classes", { headers: headers() });
  const data = await response.json();

  schedClassSelect.innerHTML = '<option value="">-- Select class --</option>';
  
  if (!response.ok) {
    console.error("Unable to load classes");
    return;
  }

  if (data.classes.length === 0) {
    return;
  }

  data.classes.forEach((className) => {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    schedClassSelect.appendChild(option);
  });
}

async function loadSchedules() {
  const response = await fetch("/api/admin/schedules", { headers: headers() });
  const data = await response.json();

  scheduleList.innerHTML = "";
  
  if (!response.ok) {
    console.error("Unable to load schedules");
    return;
  }

  if (data.schedules.length === 0) {
    scheduleList.innerHTML = "<li style=\"text-align: center; color: var(--text-light);\">No schedules created yet</li>";
    return;
  }

  data.schedules.forEach((schedule) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${schedule.subject}</strong> - ${schedule.teacherId}
      <div style="color: var(--text-light); font-size: 12px; margin-top: 6px; line-height: 1.8;">
         Class: <strong>${schedule.className}</strong> | 
         ${schedule.day} | 
         ${schedule.startTime} - ${schedule.endTime}
      </div>
    `;
    scheduleList.appendChild(item);
  });
}

createTeacherForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(createTeacherForm);

  const payload = {
    id: form.get("id").trim(),
    name: form.get("name").trim(),
    email: form.get("email").trim(),
    phone: form.get("phone").trim(),
    password: form.get("password"),
  };

  if (!payload.password || payload.password.length < 6) {
    showMessage("Password must be at least 6 characters");
    return;
  }

  const response = await fetch("/api/admin/register-teacher", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    showMessage(data.error || "Unable to create teacher account");
    return;
  }

  createTeacherForm.reset();
  showMessage("✓ Teacher account created successfully", true);
  loadTeachers();
  refreshDashboard();
});

addStudentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(addStudentForm);

  const payload = {
    id: form.get("id").trim(),
    name: form.get("name").trim(),
    className: form.get("className").trim(),
    email: form.get("email").trim(),
    phone: form.get("phone").trim(),
    dateOfBirth: form.get("dateOfBirth"),
    address: form.get("address").trim(),
    parentName: form.get("parentName").trim(),
    parentPhone: form.get("parentPhone").trim(),
  };

  const response = await fetch("/api/admin/add-student", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    showMessage(data.error || "Unable to register student");
    return;
  }

  addStudentForm.reset();
  showMessage("✓ Student registered successfully", true);
  loadClasses(); // Refresh classes list since a new student was added
  refreshDashboard();
});

createScheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(createScheduleForm);

  const payload = {
    teacherId: form.get("teacherId").trim(),
    className: form.get("className").trim(),
    subject: form.get("subject").trim(),
    startTime: form.get("startTime"),
    endTime: form.get("endTime"),
    day: form.get("day"),
  };

  if (!payload.teacherId || !payload.className || !payload.subject || !payload.startTime || !payload.endTime || !payload.day) {
    showMessage("All fields are required");
    return;
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(payload.startTime)) {
    showMessage("Invalid start time format. Please use HH:MM format (e.g., 09:30)");
    return;
  }

  if (!timeRegex.test(payload.endTime)) {
    showMessage("Invalid end time format. Please use HH:MM format (e.g., 10:30)");
    return;
  }

  // Validate that start time is before end time
  const [startHour, startMin] = payload.startTime.split(":").map(Number);
  const [endHour, endMin] = payload.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    showMessage("Start time must be before end time");
    return;
  }

  const response = await fetch("/api/admin/create-schedule", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    showMessage(data.error || "Unable to create schedule");
    return;
  }

  createScheduleForm.reset();
  showMessage(`✓ Schedule created for ${payload.subject} (${payload.startTime}-${payload.endTime})`, true);
  loadSchedules(); // Refresh schedules list
  refreshDashboard();
});

// ============================================
// Chart.js Initialization Functions
// ============================================

// Refresh all charts and tables after data changes
async function refreshDashboard() {
  await Promise.all([
    initializeAttendanceChart(),
    initializeTeacherPerformanceChart(),
    initializeAttendanceDataTable(),
    initializeStudentDataTable()
  ]);
}

async function initializeAttendanceChart() {
  const ctx = document.getElementById("classAttendanceChart");
  if (!ctx) return;

  // Fetch attendance data
  const response = await fetch("/api/admin/attendance-stats", { headers: headers() });
  
  if (!response.ok) {
    console.error("Unable to fetch attendance stats");
    return;
  }

  const data = await response.json();
  const stats = data.stats || { present: 0, absent: 0, total: 0 };

  // Destroy previous instance if exists
  if (classAttendanceChartInstance) {
    classAttendanceChartInstance.destroy();
  }

  classAttendanceChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [stats.present || 0, stats.absent || 0],
          backgroundColor: ["#10b981", "#ef4444"],
          borderColor: ["#059669", "#dc2626"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: { size: 12, weight: "bold" },
            generateLabels: function (chart) {
              const data = chart.data;
              return data.labels.map((label, i) => ({
                text: `${label}: ${data.datasets[0].data[i]}`,
                fillStyle: data.datasets[0].backgroundColor[i],
              }));
            },
          },
        },
      },
    },
  });
}

async function initializeTeacherPerformanceChart() {
  const ctx = document.getElementById("teacherPerformanceChart");
  if (!ctx) return;

  // Fetch teacher data
  const response = await fetch("/api/admin/teachers", { headers: headers() });
  
  if (!response.ok) {
    console.error("Unable to fetch teacher data");
    return;
  }

  const data = await response.json();
  const teachers = data.teachers || [];

  // Destroy previous instance if exists
  if (teacherPerformanceChartInstance) {
    teacherPerformanceChartInstance.destroy();
  }

  const topTeachers = teachers.slice(0, 10);
  const labels = topTeachers.map((t) => t.name || t.id);
  const sessionsMarkedData = topTeachers.map((t) => Number(t.sessionsMarked) || 0);
  const classAssignmentData = topTeachers.map((t) => (t.assignedClass ? 1 : 0));
  const hasSessionData = sessionsMarkedData.some((v) => v > 0);
  const datasetData = hasSessionData ? sessionsMarkedData : classAssignmentData;
  const datasetLabel = hasSessionData ? "Attendance Sessions Marked" : "Classes Assigned";
  const maxValue = Math.max(...datasetData, 0);

  teacherPerformanceChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: datasetLabel,
          data: datasetData,
          backgroundColor: "#3498db",
          borderColor: "#2980b9",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          max: maxValue <= 1 ? 1 : undefined,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            padding: 15,
            font: { size: 12, weight: "bold" },
          },
        },
      },
    },
  });
}

// ============================================
// DataTables Initialization Functions
// ============================================

async function initializeAttendanceDataTable() {
  const table = document.getElementById("attendanceTable");
  if (!table) return;

  // Destroy previous instance if exists
  if (attendanceDataTable) {
    attendanceDataTable.destroy();
  }

  attendanceDataTable = $("#attendanceTable").DataTable({
    processing: true,
    serverSide: false,
    columns: [
      { data: "date", title: "Date" },
      { data: "className", title: "Class" },
      { data: "teacherId", title: "Teacher" },
      { data: "subject", title: "Subject" },
      { data: "present", title: "Present" },
      { data: "absent", title: "Absent" },
      { data: "total", title: "Total" },
      {
        data: null,
        title: "Rate",
        render: function (data) {
          const rate = data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0;
          const badgeClass = rate >= 80 ? "badge-success" : rate >= 60 ? "badge-warning" : "badge-danger";
          return `<span class="badge ${badgeClass}">${rate}%</span>`;
        },
      },
    ],
    pageLength: 10,
    lengthMenu: [10, 25, 50],
    order: [[0, "desc"]],
    responsive: true,
  });

  // Fetch and populate data
  fetch("/api/admin/attendance-summary", { headers: headers() })
    .then((res) => res.json())
    .then((data) => {
      attendanceDataTable.clear().rows.add(data.attendance || []).draw();
    })
    .catch((err) => console.error("Error loading attendance data:", err));
}

async function initializeStudentDataTable() {
  const table = document.getElementById("studentsTable");
  if (!table) return;

  // Destroy previous instance if exists
  if (studentDataTable) {
    studentDataTable.destroy();
  }

  studentDataTable = $("#studentsTable").DataTable({
    processing: true,
    serverSide: false,
    columns: [
      { data: "id", title: "ID" },
      { data: "name", title: "Name" },
      { data: "className", title: "Class" },
      { data: "email", title: "Email" },
      { data: "phone", title: "Phone" },
      { data: "parentName", title: "Parent" },
      {
        data: "admissionDate",
        title: "Admission Date",
        render: function (data) {
          return moment(data).format("DD MMM YYYY");
        },
      },
    ],
    pageLength: 15,
    lengthMenu: [10, 25, 50],
    order: [[1, "asc"]],
    responsive: true,
    dom: '<"datatable-top"<"datatable-left"l>f<"datatable-right"p>>t<"datatable-bottom"ip>',
  });

  // Fetch and populate data
  fetch("/api/admin/all-students", { headers: headers() })
    .then((res) => res.json())
    .then((data) => {
      studentDataTable.clear().rows.add(data.students || []).draw();
    })
    .catch((err) => console.error("Error loading student data:", err));
}

// ============================================
// Select2 Initialization
// ============================================

function initializeSelect2() {
  if ($.fn.select2) {
    $(schedTeacherSelect).select2({
      width: "100%",
      placeholder: "-- Select teacher --",
      allowClear: true,
      theme: "classic",
    });

    $(schedClassSelect).select2({
      width: "100%",
      placeholder: "-- Select class --",
      allowClear: true,
      theme: "classic",
    });
  }
}

// ============================================
// AOS (Animate On Scroll) Initialization
// ============================================

function initializeAOS() {
  AOS.init({
    duration: 800,
    easing: "ease-in-out-quad",
    once: true,
    offset: 100,
  });
}

function setActiveSection(sectionId) {
  const groups = document.querySelectorAll(".dashboard-group");
  groups.forEach((group) => {
    const isTarget = group.id === sectionId;
    group.classList.toggle("is-collapsed", !isTarget);
  });

  const navLinks = document.querySelectorAll(".dashboard-jump-nav a[data-open-section]");
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.openSection === sectionId);
  });
}

function openSectionFromAction(sectionId, focusId) {
  if (!sectionId) return;
  setActiveSection(sectionId);

  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (focusId) {
    setTimeout(() => {
      const focusEl = document.getElementById(focusId);
      if (focusEl && typeof focusEl.focus === "function") {
        focusEl.focus({ preventScroll: true });
      }
    }, 350);
  }
}

function initializeDashboardActions() {
  const actionButtons = document.querySelectorAll(".action-btn[data-open-section]");
  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openSectionFromAction(button.dataset.openSection, button.dataset.focusId);
    });
  });

  const navLinks = document.querySelectorAll(".dashboard-jump-nav a[data-open-section]");
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openSectionFromAction(link.dataset.openSection);
    });
  });
}

// ============================================
// Startup: Initialize All Libraries
// ============================================

async function initializeAllLibraries() {
  // Load initial data
  loadTeachers();
  loadClasses();
  loadSchedules();

  // Initialize Select2 (must be done after DOM is ready and Select2 is loaded)
  setTimeout(() => {
    initializeSelect2();
  }, 100);

  // Initialize Charts
  setTimeout(() => {
    initializeAttendanceChart();
    initializeTeacherPerformanceChart();
  }, 500);

  // Initialize DataTables
  setTimeout(() => {
    initializeAttendanceDataTable();
    initializeStudentDataTable();
  }, 800);

  // Initialize AOS
  setTimeout(() => {
    initializeAOS();
  }, 1000);

  // Auto-refresh dashboard every 30 seconds
  setInterval(refreshDashboard, 30000);
}

// Setup Logout Button Handler
function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: "Logout?",
          text: "Are you sure you want to logout?",
          icon: "question",
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Yes, Logout",
          cancelButtonText: "Cancel",
          showCancelButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((result) => {
          if (result.isConfirmed) {
            // Clear all auth-related localStorage items
            localStorage.removeItem("ams_token");
            localStorage.removeItem("ams_role");
            localStorage.removeItem("ams_user");
            
            // Redirect to login page
            setTimeout(() => {
              window.location.href = "/";
            }, 300);
          }
        });
      } else {
        // Fallback if SweetAlert2 is not loaded
        if (confirm("Are you sure you want to logout?")) {
          localStorage.removeItem("ams_token");
          localStorage.removeItem("ams_role");
          localStorage.removeItem("ams_user");
          window.location.href = "/";
        }
      }
    });
  }
}

// Load initial data and initialize libraries
setupLogoutButton();
initializeDashboardActions();
loadTeachers();
loadClasses();
loadSchedules();
initializeAllLibraries();

