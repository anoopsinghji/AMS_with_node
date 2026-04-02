const messageEl = document.getElementById("message");
const loginForm = document.getElementById("loginForm");

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

// AOS Initialization
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-in-out-quad",
      once: true,
      offset: 100,
    });
  }

  // Add animation to form elements
  const formElements = document.querySelectorAll(".form-group, .demo-credentials");
  formElements.forEach((el, index) => {
    el.setAttribute("data-aos", "fade-up");
    el.setAttribute("data-aos-delay", index * 100);
  });
});

function showMessage(text, ok = false) {
  if (ok) {
    toastr.success(text, "Success!", { timeOut: 3000 });
  } else {
    toastr.error(text, "Error!", { timeOut: 4000 });
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("id").value.trim();
  const password = document.getElementById("password").value;

  if (!id || !password) {
    showMessage("Please enter both ID and Password", false);
    return;
  }

  // Show loading toast
  toastr.info("Signing in...", "Please wait", { timeOut: 0 });

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      toastr.clear();
      showMessage(data.error || "Invalid credentials", false);
      return;
    }

    localStorage.setItem("ams_token", data.token);
    localStorage.setItem("ams_role", data.user.role);

    // Clear toasts and show success
    toastr.clear();
    toastr.success(`Welcome ${data.user.name || data.user.id}!`, "Login Successful", {
      timeOut: 2000,
      onHidden: () => {
        if (data.user.role === "principal") {
          window.location.href = "/principal";
        } else if (data.user.role === "teacher") {
          window.location.href = "/teacher";
        }
      },
    });
  } catch (_error) {
    toastr.clear();
    showMessage("Could not connect to server. Please check your connection.", false);
  }
});
