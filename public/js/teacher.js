const token = localStorage.getItem("ams_token");
const role = localStorage.getItem("ams_role");

if (!token || role !== "teacher") {
  window.location.href = "/";
}

// ============================================
// Initialize Libraries
// ============================================

// Toastr Configuration
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

// DOM Elements
const modal = document.getElementById("attendanceModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelAttendanceBtn = document.getElementById("cancelAttendanceBtn");
const submitAttendanceBtn = document.getElementById("submitAttendanceBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const deselectAllBtn = document.getElementById("deselectAllBtn");
const attendanceForm = document.getElementById("attendanceForm");
const attendanceDate = document.getElementById("attendanceDate");

// Initialize Flatpickr Date Picker
if (attendanceDate && typeof flatpickr !== "undefined") {
  flatpickr(attendanceDate, {
    enableTime: false,
    dateFormat: "Y-m-d",
    defaultDate: new Date(),
    maxDate: "today",
    theme: "light",
    disableMobile: false,
  });
}

// Initialize AOS (Animate On Scroll)
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-in-out-quad",
      once: true,
      offset: 100,
    });
  }
});

// Initialize date input fallback
attendanceDate.value = new Date().toISOString().slice(0, 10);

let currentScheduleId = null;
let currentScheduleData = null;
let schedules = [];
let markedScheduleIds = new Set();

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

function formatTime(time) {
  return time ? time.substring(0, 5) : "-";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDayName(index) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[index];
}

function getTodayDayName() {
  const today = new Date();
  return getDayName(today.getDay());
}

function isTodayClass(schedule) {
  const dayName = getTodayDayName();
  return schedule.day === dayName;
}

function isUpcomingClass(schedule) {
  const dayName = getTodayDayName();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const scheduleDayIndex = days.indexOf(schedule.day);
  const todayIndex = today.getDay();
  return scheduleDayIndex > todayIndex;
}

function isPendingClass(schedule) {
  return !isTodayClass(schedule) && !isUpcomingClass(schedule);
}

async function loadSchedules() {
  try {
    const response = await fetch("/api/teacher/my-schedule", {
      headers: headers(),
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage(data.error || "Unable to load schedule");
      return;
    }

    schedules = data.schedules || [];
    markedScheduleIds = new Set(data.markedScheduleIds || []);
    organizeAndDisplaySchedules();
  } catch (error) {
    showMessage("Network error while loading schedules");
  }
}

function organizeAndDisplaySchedules() {
  const today = getToday();
  const todaySchedules = schedules.filter(isTodayClass);
  const pendingSchedules = schedules.filter(isPendingClass);
  const upcomingSchedules = schedules.filter(isUpcomingClass);

  // Update counts
  document.getElementById("todayCount").textContent = todaySchedules.length;
  document.getElementById("pendingCount").textContent = pendingSchedules.length;
  document.getElementById("upcomingCount").textContent = upcomingSchedules.length;
  document.getElementById("totalCount").textContent = schedules.length;

  document.getElementById("todayBadge").textContent = todaySchedules.length;
  document.getElementById("pendingBadge").textContent = pendingSchedules.length;
  document.getElementById("upcomingBadge").textContent = upcomingSchedules.length;

  // Display classes
  displayScheduleGroup("todayClasses", todaySchedules, "today");
  displayScheduleGroup("pendingClasses", pendingSchedules, "pending");
  displayScheduleGroup("upcomingClasses", upcomingSchedules, "upcoming");
}

function displayScheduleGroup(elementId, scheduleList, type) {
  const container = document.getElementById(elementId);
  
  if (scheduleList.length === 0) {
    const dayName = getTodayDayName();
    if (type === "today") {
      container.innerHTML = `<p class="empty-state">No classes scheduled for today (${dayName})</p>`;
    } else if (type === "pending") {
      container.innerHTML = `<p class="empty-state">No past classes to mark</p>`;
    } else {
      container.innerHTML = `<p class="empty-state">No upcoming classes scheduled</p>`;
    }
    return;
  }

  container.innerHTML = scheduleList.map(schedule => {
    const isMarked = markedScheduleIds.has(schedule.id);
    const cardClassName = isMarked ? `${type} completed` : type;
    const actionHtml = isMarked
      ? `
        <span class="card-badge card-badge-success">
          <i class="fas fa-check-circle"></i> Marked
        </span>
        <button class="card-btn card-btn-disabled" type="button" disabled>
          <i class="fas fa-check"></i> Already Marked
        </button>
      `
      : `
        <button class="card-btn" type="button" onclick="openAttendanceModal('${schedule.id}', '${schedule.className}', '${schedule.subject}', '${schedule.startTime}', '${schedule.endTime}')">
          <i class="fas fa-clipboard-list"></i> Mark Attendance
        </button>
      `;

    return `
      <div class="class-card ${cardClassName}">
        <div class="class-card-content">
          <p class="class-card-title">${schedule.subject}</p>
          <p class="class-card-meta">
            <span><i class="fas fa-book"></i> ${schedule.className}</span>
            <span><i class="fas fa-clock"></i> ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</span>
            <span><i class="fas fa-calendar"></i> ${schedule.day}</span>
          </p>
        </div>
        <div class="class-card-action">
          ${actionHtml}
        </div>
      </div>
    `;
  }).join("");
}

function openAttendanceModal(scheduleId, className, subject, startTime, endTime) {
  currentScheduleId = scheduleId;
  currentScheduleData = { scheduleId, className, subject, startTime, endTime };
  
  // Update modal header info
  document.getElementById("modalTitle").textContent = `📝 Mark Attendance - ${subject}`;
  document.getElementById("modalClass").textContent = className;
  document.getElementById("modalSubject").textContent = subject;
  document.getElementById("modalTime").textContent = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  
  // Reset date to today
  attendanceDate.value = getToday();
  
  // Load students for this schedule
  loadScheduleStudents(scheduleId);
  
  // Show modal
  modal.classList.add("show");
}

async function loadScheduleStudents(scheduleId) {
  try {
    const response = await fetch(`/api/teacher/schedule/${scheduleId}/students`, {
      headers: headers(),
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage(data.error || "Unable to load students");
      return;
    }

    attendanceForm.innerHTML = "";
    const students = data.students || [];

    if (students.length === 0) {
      attendanceForm.innerHTML = "<p class='empty-state'>No students in this class</p>";
      return;
    }

    students.forEach((student) => {
      const label = document.createElement("label");
      label.className = "student-row";
      label.innerHTML = `
        <input type="checkbox" value="${student.id}" />
        <span>${student.id} - ${student.name}</span>
      `;
      attendanceForm.appendChild(label);
    });
  } catch (error) {
    showMessage("Network error while loading students");
  }
}

function closeModal() {
  modal.classList.remove("show");
  currentScheduleId = null;
  currentScheduleData = null;
  attendanceForm.innerHTML = "";
}

function selectAllStudents() {
  attendanceForm.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = true);
}

function deselectAllStudents() {
  attendanceForm.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
}

// Event Listeners - Modal Controls
closeModalBtn.addEventListener("click", closeModal);
cancelAttendanceBtn.addEventListener("click", closeModal);
selectAllBtn.addEventListener("click", selectAllStudents);
deselectAllBtn.addEventListener("click", deselectAllStudents);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Submit Attendance
submitAttendanceBtn.addEventListener("click", async () => {
  const checked = [...attendanceForm.querySelectorAll("input[type='checkbox']:checked")];
  const presentIds = checked.map((item) => item.value);

  if (presentIds.length === 0) {
    Swal.fire({
      title: "No Students Selected",
      text: "Please mark at least one student as present before submitting.",
      icon: "warning",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "OK",
    });
    return;
  }

  // Show confirmation
  const totalStudents = attendanceForm.querySelectorAll("input[type='checkbox']").length;
  const absentCount = totalStudents - presentIds.length;
  
  Swal.fire({
    title: "Confirm Attendance",
    html: `
      <div style="text-align: left; padding: 12px;">
        <p><strong>${presentIds.length}</strong> students marked <span style="color: #10b981;">✓ Present</span></p>
        <p><strong>${absentCount}</strong> students marked <span style="color: #ef4444;">✗ Absent</span></p>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 12px;">Date: <strong>${attendanceDate.value}</strong></p>
      </div>
    `,
    icon: "question",
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Submit",
    cancelButtonText: "Cancel",
    showCancelButton: true,
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Submitting...",
      text: "Please wait",
      icon: "info",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();

        try {
          const response = await fetch("/api/teacher/submit-attendance", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({
              date: attendanceDate.value,
              presentIds,
              scheduleId: currentScheduleId,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            Swal.fire({
              title: "Submission Failed!",
              text: data.error || "Unable to submit attendance",
              icon: "error",
              confirmButtonColor: "#ef4444",
              confirmButtonText: "OK",
            });
            return;
          }

          Swal.fire({
            title: "Success!",
            html: `
              <div>
                <p>Attendance submitted successfully!</p>
                <p style="font-size: 14px; color: #9ca3af; margin-top: 8px;">
                  ${presentIds.length} students marked present<br>
                  ${currentScheduleData.subject} - ${currentScheduleData.className}
                </p>
              </div>
            `,
            icon: "success",
            confirmButtonColor: "#10b981",
            confirmButtonText: "OK",
            timer: 3000,
            timerProgressBar: true,
          }).then(() => {
            closeModal();
            loadSchedules(); // Refresh schedule list
          });
        } catch (error) {
          Swal.fire({
            title: "Network Error!",
            text: "Could not connect to server.",
            icon: "error",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "OK",
          });
        }
      },
    });
  });
});

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

// Load schedules on page load
setupLogoutButton();
loadSchedules();

