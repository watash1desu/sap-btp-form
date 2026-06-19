// ================================================================
// MOCK REQUEST DATA
// Since there's no backend yet, this array simulates what would
// normally come from the database — a list of previously submitted
// requests. Each one has a status used by both the dashboard cards
// and the requests list below them.
// ================================================================
let mockRequests = [
  { title: "Request for Development Subaccount", category: "Subaccount Creation", dueDate: "2026-06-20", priority: "high", status: "pending" },
  { title: "Role Access for Finance Reporting", category: "Role Access in SAP BTP", dueDate: "2026-06-18", priority: "medium", status: "accepted" },
  { title: "New Directory for QA Team", category: "Directory Creation", dueDate: "2026-06-22", priority: "low", status: "in-progress" },
  { title: "Entitlement Increase — AI Core", category: "Entitlement Configuration", dueDate: "2026-06-19", priority: "high", status: "rejected" },
  { title: "Subaccount Name Change — DEV01", category: "Subaccount Name Change", dueDate: "2026-06-17", priority: "medium", status: "accepted" },
  { title: "Use Case Initiation — Document AI", category: "Use Case Initiation", dueDate: "2026-06-25", priority: "low", status: "draft" }
];

let currentRequestFilter = "all"; // tracks which dashboard card is active


// ================================================================
// STEP NAVIGATION — New Request form (steps 1-6)
// ================================================================

let currentStep = 1;
const totalSteps = 6;

function validateCurrentStep() {
  const currentPage = document.getElementById("step-" + currentStep);
  const requiredGroups = currentPage.querySelectorAll(".field-group:has(.required)");
  let allValid = true;

  requiredGroups.forEach(function(group) {
    const input = group.querySelector("input[type='text'], input[type='date'], input[type='number'], textarea, select");
    const radioInputs = group.querySelectorAll("input[type='radio']");

    if (radioInputs.length > 0) {
      const anyChecked = Array.from(radioInputs).some(function(radio) {
        return radio.checked;
      });
      if (!anyChecked) {
        allValid = false;
        group.classList.add("field-error");
      } else {
        group.classList.remove("field-error");
      }
    } else if (input) {
      if (!input.value || input.value.trim() === "") {
        allValid = false;
        input.classList.add("input-error");
      } else {
        input.classList.remove("input-error");
      }
    }
  });

  return allValid;
}

function goToStep(stepNumber) {
  const currentPage = document.getElementById("step-" + currentStep);
  currentPage.classList.remove("active");

  const currentTrackerItem = document.querySelector(".tracker-item[data-step='" + currentStep + "']");
  currentTrackerItem.classList.remove("active");

  currentStep = stepNumber;

  const nextPage = document.getElementById("step-" + currentStep);
  nextPage.classList.add("active");

  const nextTrackerItem = document.querySelector(".tracker-item[data-step='" + currentStep + "']");
  nextTrackerItem.classList.add("active");

  updateFooterButtons();

  if (currentStep === 6) {
    renderReviewSummary();
  }

  document.querySelector(".form-content").scrollTop = 0;
}

function goNext() {
  if (currentStep >= totalSteps) return;

  const isValid = validateCurrentStep();
  if (!isValid) return;

  const currentTrackerItem = document.querySelector(".tracker-item[data-step='" + currentStep + "']");
  currentTrackerItem.classList.add("completed");
  currentTrackerItem.querySelector(".tracker-circle").textContent = "✓";

  goToStep(currentStep + 1);
}

function goBack() {
  if (currentStep <= 1) return;

  const targetStep = currentStep - 1;
  const targetTrackerItem = document.querySelector(".tracker-item[data-step='" + targetStep + "']");
  targetTrackerItem.classList.remove("completed");
  targetTrackerItem.querySelector(".tracker-circle").textContent = targetStep;

  goToStep(targetStep);
}

function updateFooterButtons() {
  const backButton = document.getElementById("btn-back");
  const nextButton = document.getElementById("btn-next");

  backButton.disabled = (currentStep === 1);

  if (currentStep === totalSteps) {
    nextButton.textContent = "Submit Request";
    nextButton.onclick = submitForm;
  } else {
    nextButton.textContent = "Next";
    nextButton.onclick = goNext;
  }
}

// ================================================================
// submitForm() — called when Submit Request is clicked on step 6
// Adds the request to the mock list as "pending", then returns
// to the Dashboard so the new request shows up immediately.
// ================================================================
function submitForm() {
  const newRequest = {
    title: getFieldValue("requestTitle") !== "—" ? getFieldValue("requestTitle") : "Untitled Request",
    category: getFieldValue("requestCategory") !== "—" ? getFieldValue("requestCategory") : "—",
    dueDate: getFieldValue("requiredByDate") !== "—" ? getFieldValue("requiredByDate") : "—",
    priority: getCheckedRadioValue("priority"),
    status: "pending"
  };
  mockRequests.unshift(newRequest); // adds to the front so it's "latest first"

  alert("Your service request has been submitted successfully!\n\nIt has been routed to:\n• Reporting Manager\n• BTP Platform Team\n• Finance Team\n• Security Team");

  showDashboard();
}

// ================================================================
// handleSaveDraft() — Save as Draft button
// Frontend-only for now: adds the current request as a "draft"
// to the mock list and returns to the Dashboard.
// ================================================================
function handleSaveDraft() {
  const newDraft = {
    title: getFieldValue("requestTitle") !== "—" ? getFieldValue("requestTitle") : "Untitled Draft",
    category: getFieldValue("requestCategory") !== "—" ? getFieldValue("requestCategory") : "—",
    dueDate: getFieldValue("requiredByDate") !== "—" ? getFieldValue("requiredByDate") : "—",
    priority: getCheckedRadioValue("priority"),
    status: "draft"
  };
  mockRequests.unshift(newDraft);

  alert("Your request has been saved as a draft.");
  showDashboard();
}


// ================================================================
// INITIALISE on page load
// ================================================================
updateFooterButtons();


// ================================================================
// BACKEND URL
// ================================================================
const API_URL = "http://localhost:4000";


// ================================================================
// AUTH TABS
// ================================================================
function showAuthTab(tab) {
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-signup").classList.toggle("active", tab === "signup");
  document.getElementById("login-form").classList.toggle("active", tab === "login");
  document.getElementById("signup-form").classList.toggle("active", tab === "signup");
}

// ================================================================
// enterApp(username)
// Initials logic: two words -> first letter of each; one word ->
// first two letters of it.
// ================================================================
function enterApp(username) {
  const words = username.trim().split(/\s+/);
  let initials;

  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    initials = username.substring(0, 2).toUpperCase();
  }

  // First name shown next to the avatar — just the first word typed,
  // with the first letter capitalized for a clean look (e.g. "rituparna" -> "Rituparna")
  const firstNameRaw = words[0];
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);

  document.getElementById("user-avatar").textContent = initials;
  document.getElementById("user-name").textContent = firstName;
  document.getElementById("login-page").style.display = "none";
  const wrapper = document.getElementById("form-wrapper");
  wrapper.classList.remove("hidden");
  wrapper.style.display = ""; // clear the inline display:none failsafe

  // Land on the Dashboard right after login
  showDashboard();
}

async function handleLogin() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorMsg = document.getElementById("login-error");

  if (!username || !password) {
    errorMsg.textContent = "Please enter your username and password.";
    errorMsg.classList.add("visible");
    return;
  }

  try {
    const response = await fetch(API_URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.error;
      errorMsg.classList.add("visible");
      return;
    }

    errorMsg.classList.remove("visible");
    enterApp(data.username);

  } catch (err) {
    errorMsg.textContent = "Could not reach the server. Is the backend running?";
    errorMsg.classList.add("visible");
  }
}

document.getElementById("loginPassword").addEventListener("keydown", function(e) {
  if (e.key === "Enter") handleLogin();
});

document.getElementById("loginUsername").addEventListener("keydown", function(e) {
  if (e.key === "Enter") handleLogin();
});

async function handleSignup() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const errorMsg = document.getElementById("signup-error");

  if (!username || !password) {
    errorMsg.textContent = "Please choose a username and password.";
    errorMsg.classList.add("visible");
    return;
  }

  try {
    const response = await fetch(API_URL + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.error;
      errorMsg.classList.add("visible");
      return;
    }

    errorMsg.classList.remove("visible");
    enterApp(data.username);

  } catch (err) {
    errorMsg.textContent = "Could not reach the server. Is the backend running?";
    errorMsg.classList.add("visible");
  }
}

// ================================================================
// handleCancel() — Cancel button while inside New Request form
// Returns to the Dashboard (not the login page anymore).
// ================================================================
function handleCancel() {
  const confirmed = confirm("Are you sure you want to cancel? Your progress will be lost.");
  if (confirmed) {
    showDashboard();
  }
}


// ================================================================
// FILE UPLOAD — Step 5: Attachments
// ================================================================
let uploadedFiles = [];

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => uploadedFiles.push(file.name));
  renderFileList();
}

function renderFileList() {
  const list = document.getElementById("file-list");
  list.innerHTML = "";
  uploadedFiles.forEach(function(name) {
    const li = document.createElement("li");
    li.textContent = name;
    list.appendChild(li);
  });
}


// ================================================================
// REVIEW SUMMARY — Step 6 (redesigned as cards)
// Groups fields into cards matching each form section, instead of
// one long flat list.
// ================================================================
function getFieldValue(id) {
  const el = document.getElementById(id);
  return el && el.value ? el.value : "—";
}

function getCheckedRadioValue(name) {
  const checked = document.querySelector("input[name='" + name + "']:checked");
  return checked ? checked.value : "—";
}

function buildReviewCard(title, icon, rows) {
  let html = "<div class='review-card'>";
  html += "<div class='review-card-header'><span>" + icon + "</span><span>" + title + "</span></div>";
  html += "<div class='review-card-body'>";
  rows.forEach(function(row) {
    html += "<div class='review-row'><span class='review-row-label'>" + row[0] + "</span><span class='review-row-value'>" + row[1] + "</span></div>";
  });
  html += "</div></div>";
  return html;
}

function renderReviewSummary() {
  const summary = document.getElementById("review-summary");

  let html = "";

  html += buildReviewCard("Request Details", "&#128196;", [
    ["Category", getFieldValue("requestCategory")],
    ["Priority", getCheckedRadioValue("priority")],
    ["Title", getFieldValue("requestTitle")],
    ["Required By", getFieldValue("requiredByDate")]
  ]);

  html += buildReviewCard("Service Configuration", "&#9729;", [
    ["Subaccount Name", getFieldValue("subaccountName")],
    ["Region", getFieldValue("region")],
    ["Environment", getCheckedRadioValue("environment")],
    ["Estimated Users", getFieldValue("estimatedUsers")]
  ]);

  html += buildReviewCard("Financial Assessment", "&#128176;", [
    ["Cost Implication", getCheckedRadioValue("costImplication")],
    ["Monthly Cost (INR)", getFieldValue("monthlyCost")],
    ["Cost Center", getFieldValue("costCenter")]
  ]);

  html += buildReviewCard("Impact Analysis", "&#128737;", [
    ["Security Impact", getFieldValue("securityImpact")],
    ["Operational Impact", getFieldValue("operationalImpact")],
    ["Data Privacy Impact", getFieldValue("dataPrivacyImpact")]
  ]);

  html += buildReviewCard("Attachments", "&#128206;", [
    ["Files", uploadedFiles.length > 0 ? uploadedFiles.join(", ") : "No files attached"]
  ]);

  html += "<div class='review-approval-note'><span class='info-icon-circle'>i</span><span>Once submitted, this request will be routed to your Reporting Manager, the BTP Platform Team, Finance Team, and Security Team for approval.</span></div>";

  summary.innerHTML = html;
}


// ================================================================
// APP NAV — switching between Dashboard and New Request
// ================================================================

function showDashboard() {
  // Swap sidebar: app-nav visible, step-tracker hidden
  document.getElementById("app-nav").classList.remove("hidden");
  document.getElementById("step-tracker").classList.add("hidden");

  // Swap main content
  document.getElementById("dashboard-view").classList.add("active");
  document.getElementById("new-request-view").classList.remove("active");

  // Update nav highlighting
  document.getElementById("nav-dashboard").classList.add("active");
  document.getElementById("nav-new-request").classList.remove("active");

  // Update page title bar
  document.getElementById("page-title").textContent = "Dashboard";
  document.getElementById("page-subtitle").textContent = "Overview of your service requests";
  document.getElementById("btn-cancel").style.display = "none";

  // Hide the form footer (Back/Save/Next) since we're not in the form
  document.getElementById("form-footer").style.display = "none";

  // Refresh dashboard numbers and list every time we land here
  renderDashboard();
}

function showNewRequestForm() {
  // Always start a fresh blank form when entering from the sidebar
  resetRequestForm();

  // Swap sidebar: step-tracker visible, app-nav hidden
  document.getElementById("app-nav").classList.add("hidden");
  document.getElementById("step-tracker").classList.remove("hidden");

  // Swap main content
  document.getElementById("dashboard-view").classList.remove("active");
  document.getElementById("new-request-view").classList.add("active");

  // Update nav highlighting
  document.getElementById("nav-dashboard").classList.remove("active");
  document.getElementById("nav-new-request").classList.add("active");

  // Update page title bar
  document.getElementById("page-title").textContent = "New Service Request";
  document.getElementById("page-subtitle").textContent = "Raise a request for BTP Infrastructure, Entitlements or Access";
  document.getElementById("btn-cancel").style.display = "inline-block";

  // Show the form footer again
  document.getElementById("form-footer").style.display = "flex";
}


// ================================================================
// resetRequestForm()
// Clears every field across all 6 steps, clears uploaded files,
// removes "completed" checkmarks and error highlights from the
// tracker/fields, and jumps back to step 1.
//
// This is the fix for the bug where re-opening "New Request" kept
// showing whichever step (and filled-in values) you'd left behind —
// it was never being reset, only re-displayed.
// ================================================================
function resetRequestForm() {
  const newRequestView = document.getElementById("new-request-view");

  // Clear every text/number/date input and textarea
  newRequestView.querySelectorAll("input[type='text'], input[type='number'], input[type='date'], textarea").forEach(function(field) {
    field.value = "";
    field.classList.remove("input-error");
  });

  // Reset every dropdown back to its placeholder option
  newRequestView.querySelectorAll("select").forEach(function(select) {
    select.selectedIndex = 0;
  });

  // Uncheck every radio button
  newRequestView.querySelectorAll("input[type='radio']").forEach(function(radio) {
    radio.checked = false;
  });

  // Remove any leftover red error highlights on field-groups
  newRequestView.querySelectorAll(".field-error").forEach(function(group) {
    group.classList.remove("field-error");
  });

  // Clear uploaded files list (Step 5)
  uploadedFiles = [];
  renderFileList();

  // Hide whichever step was active, show step 1
  newRequestView.querySelectorAll(".form-page").forEach(function(page) {
    page.classList.remove("active");
  });
  document.getElementById("step-1").classList.add("active");

  // Reset the tracker: clear completed/active states, restore numbers
  document.querySelectorAll(".tracker-item").forEach(function(item) {
    item.classList.remove("completed", "active");
    const stepNum = item.getAttribute("data-step");
    item.querySelector(".tracker-circle").textContent = stepNum;
  });
  document.querySelector(".tracker-item[data-step='1']").classList.add("active");

  currentStep = 1;
  updateFooterButtons();
}


// ================================================================
// DASHBOARD — rendering cards and the requests list
// ================================================================

function renderDashboard() {
  renderDashboardCounts();
  renderRequestsList();
}

function renderDashboardCounts() {
  const counts = { all: mockRequests.length, pending: 0, "in-progress": 0, accepted: 0, rejected: 0, draft: 0 };

  mockRequests.forEach(function(req) {
    if (counts[req.status] !== undefined) {
      counts[req.status]++;
    }
  });

  document.getElementById("count-all").textContent = counts.all;
  document.getElementById("count-pending").textContent = counts.pending;
  document.getElementById("count-inprogress").textContent = counts["in-progress"];
  document.getElementById("count-accepted").textContent = counts.accepted;
  document.getElementById("count-rejected").textContent = counts.rejected;
  document.getElementById("count-draft").textContent = counts.draft;
}

// ================================================================
// filterRequests(status)
// Called when a dashboard card is clicked. Re-renders the list
// below filtered to that status, and highlights the active card.
// The filter label text color now matches the status color instead
// of being shown as a separate badge.
// ================================================================
function filterRequests(status) {
  currentRequestFilter = status;

  document.querySelectorAll(".dash-card").forEach(function(card) {
    card.classList.toggle("active-filter", card.getAttribute("data-filter") === status);
  });

  const labelMap = {
    all: "Showing all",
    pending: "Showing pending",
    "in-progress": "Showing in progress",
    accepted: "Showing accepted",
    rejected: "Showing rejected",
    draft: "Showing drafts"
  };

  const label = document.getElementById("active-filter-label");
  label.textContent = labelMap[status];

  // Reset to default color first, then apply the status-specific color class
  label.className = "requests-filter-label";
  if (status !== "all") {
    label.classList.add("filter-label--" + status);
  }

  renderRequestsList();
}

function renderRequestsList() {
  const list = document.getElementById("requests-list");

  // Sort latest first by due date
  const sorted = [...mockRequests].sort(function(a, b) {
    return new Date(b.dueDate) - new Date(a.dueDate);
  });

  const filtered = currentRequestFilter === "all"
    ? sorted
    : sorted.filter(function(req) { return req.status === currentRequestFilter; });

  if (filtered.length === 0) {
    list.innerHTML = "<li class='empty-state'>No requests found for this filter.</li>";
    return;
  }

  let html = "";
  filtered.forEach(function(req) {
    html += "<li class='request-row'>";
    html += "<div class='request-info'>";
    html += "<span class='request-title'>" + req.title + "</span>";
    html += "<span class='request-meta'>" + req.category + "</span>";
    html += "</div>";
    html += "<span class='request-priority priority--" + req.priority + "'>" + req.priority + "</span>";
    html += "<span class='request-due-date'>&#128197; " + req.dueDate + "</span>";
    html += "<span class='status-cell'><span class='status-badge status-badge--" + req.status + "'>" + req.status.replace("-", " ") + "</span></span>";
    html += "</li>";
  });

  list.innerHTML = html;
}