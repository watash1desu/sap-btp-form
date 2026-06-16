// ================================================================
// STEP NAVIGATION — SAP BTP Service Request Form
// ================================================================

let currentStep = 1;
const totalSteps = 6;

// ================================================================
function validateCurrentStep() {
  const currentPage = document.getElementById("step-" + currentStep);

  // Get all field-groups in this step that contain a .required span
  const requiredGroups = currentPage.querySelectorAll(".field-group:has(.required)");

  let allValid = true;

  requiredGroups.forEach(function(group) {
    // Check what type of input is inside this group
    const input = group.querySelector("input[type='text'], input[type='date'], input[type='number'], textarea, select");
    const radioInputs = group.querySelectorAll("input[type='radio']");

    if (radioInputs.length > 0) {
      // Radio group — valid if ANY radio in the group is checked
      const anyChecked = Array.from(radioInputs).some(function(radio) {
        return radio.checked;
      });
      if (!anyChecked) {
        allValid = false;
        // Highlight the radio group container as missing
        group.classList.add("field-error");
      } else {
        group.classList.remove("field-error");
      }

    } else if (input) {
      // Regular input, textarea, or select — valid if it has a value
      if (!input.value || input.value.trim() === "") {
        allValid = false;
        input.classList.add("input-error"); // red border on the field itself
      } else {
        input.classList.remove("input-error");
      }
    }
  });

  return allValid;
}

// ================================================================
// Moves the form to the target step.
function goToStep(stepNumber) {

  // --- 1. Hide the current form page ---
  const currentPage = document.getElementById("step-" + currentStep);
  currentPage.classList.remove("active");

  // Remove "active" from the current tracker item in the left nav
  const currentTrackerItem = document.querySelector(".tracker-item[data-step='" + currentStep + "']");
  currentTrackerItem.classList.remove("active");

  // --- 2. Update currentStep to the new target 
  currentStep = stepNumber;

  // --- 3. Show the new step's form page 
  const nextPage = document.getElementById("step-" + currentStep);
  nextPage.classList.add("active");

  // Highlight the new step in the left nav
  const nextTrackerItem = document.querySelector(".tracker-item[data-step='" + currentStep + "']");
  nextTrackerItem.classList.add("active");

  // 4. Update footer buttons 
  updateFooterButtons();

  // If we just arrived at step 6, build the review summary from
  // everything entered in steps 1-5
  if (currentStep === 6) {
    renderReviewSummary();
  }

  // Scroll form area back to top
  document.querySelector(".form-content").scrollTop = 0;
}

// ================================================================
function goNext() {
  if (currentStep >= totalSteps) return;

  const isValid = validateCurrentStep();

  if (!isValid) {
    //dont move
    return;
  }

  // All fields are filled — mark this step as completed in the left nav
  const currentTrackerItem = document.querySelector(".tracker-item[data-step='" + currentStep + "']");
  currentTrackerItem.classList.add("completed");
  currentTrackerItem.querySelector(".tracker-circle").textContent = "✓";

  // Now move to the next step
  goToStep(currentStep + 1);
}

// ================================================================
function goBack() {
  if (currentStep <= 1) return;

  const targetStep = currentStep - 1;

  // Un-complete the step we're going back to so it doesn't show ✓
  // while the user is editing it again
  const targetTrackerItem = document.querySelector(".tracker-item[data-step='" + targetStep + "']");
  targetTrackerItem.classList.remove("completed");
  targetTrackerItem.querySelector(".tracker-circle").textContent = targetStep;

  goToStep(targetStep);
}

// ================================================================
function updateFooterButtons() {
  const backButton = document.getElementById("btn-back");
  const nextButton = document.getElementById("btn-next");

  // Disable Back on step 1
  backButton.disabled = (currentStep === 1);

  // Change Next to Submit on step 6
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
// ================================================================
function submitForm() {
  alert("Your service request has been submitted successfully!\n\nIt has been routed to:\n• Reporting Manager\n• BTP Platform Team\n• Finance Team\n• Security Team");
}

// ================================================================
// INITIALISE on page load
// ================================================================
updateFooterButtons();


// ================================================================
// BACKEND URL — where our Express server is running
// ================================================================
const API_URL = "http://localhost:4000";


// ================================================================
// showAuthTab(tab)
// Switches between the Log In form and Sign Up form on the login page.
// ================================================================
function showAuthTab(tab) {
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-signup").classList.toggle("active", tab === "signup");
  document.getElementById("login-form").classList.toggle("active", tab === "login");
  document.getElementById("signup-form").classList.toggle("active", tab === "signup");
}


// ================================================================
// enterApp(username)
// Shared by both login and signup once authentication succeeds.
// Sets the avatar initials and reveals the main form.
// ================================================================
function enterApp(username) {
  const initials = username.substring(0, 2).toUpperCase();
  document.getElementById("user-avatar").textContent = initials;
  document.getElementById("login-page").style.display = "none";
  document.getElementById("form-wrapper").classList.remove("hidden");
}


// ================================================================
// handleLogin()
// Sends username/password to the backend's /login endpoint.
// fetch() is how JavaScript talks to a server.
// ================================================================
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
      // backend responded with an error (wrong password, user not found, etc.)
      errorMsg.textContent = data.error;
      errorMsg.classList.add("visible");
      return;
    }

    errorMsg.classList.remove("visible");
    enterApp(data.username);

  } catch (err) {
    // this runs if the backend server isn't running at all
    errorMsg.textContent = "Could not reach the server. Is the backend running?";
    errorMsg.classList.add("visible");
  }
}

// Allow pressing Enter on the login fields to trigger login
document.getElementById("loginPassword").addEventListener("keydown", function(e) {
  if (e.key === "Enter") handleLogin();
});

document.getElementById("loginUsername").addEventListener("keydown", function(e) {
  if (e.key === "Enter") handleLogin();
});


// ================================================================
// handleSignup()
// Sends username/password to the backend's /signup endpoint.
// On success, auto-logs the user in via enterApp().
// ================================================================
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
      // e.g. "Username already taken"
      errorMsg.textContent = data.error;
      errorMsg.classList.add("visible");
      return;
    }

    errorMsg.classList.remove("visible");
    enterApp(data.username); // auto log in after signup

  } catch (err) {
    errorMsg.textContent = "Could not reach the server. Is the backend running?";
    errorMsg.classList.add("visible");
  }
}


// ================================================================
// Returns the user to the login page and resets the form.
function handleCancel() {
  const confirmed = confirm("Are you sure you want to cancel? Your progress will be lost.");
  if (confirmed) {
    document.getElementById("form-wrapper").classList.add("hidden");
    document.getElementById("login-page").style.display = "flex";
  }
}


// ================================================================
// FILE UPLOAD — Step 5: Attachments
// Stores selected file names in an array and renders them as a list.
// Frontend-only preview — files aren't sent anywhere yet.
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
// REVIEW SUMMARY — Step 6
// Reads values from every step's fields and displays them as a
// read-only summary before the user submits.
// Called from inside goToStep() right before showing step 6.
// ================================================================
function getFieldValue(id) {
  const el = document.getElementById(id);
  return el && el.value ? el.value : "—";
}

function getCheckedRadioValue(name) {
  const checked = document.querySelector("input[name='" + name + "']:checked");
  return checked ? checked.value : "—";
}

function renderReviewSummary() {
  const summary = document.getElementById("review-summary");

  const rows = [
    ["Request Category", getFieldValue("requestCategory")],
    ["Priority", getCheckedRadioValue("priority")],
    ["Request Title", getFieldValue("requestTitle")],
    ["Subaccount Name", getFieldValue("subaccountName")],
    ["Region", getFieldValue("region")],
    ["Environment", getCheckedRadioValue("environment")],
    ["Cost Implication", getCheckedRadioValue("costImplication")],
    ["Estimated Monthly Cost", getFieldValue("monthlyCost")],
    ["Security Impact", getFieldValue("securityImpact")],
    ["Operational Impact", getFieldValue("operationalImpact")],
    ["Attachments", uploadedFiles.length > 0 ? uploadedFiles.join(", ") : "—"]
  ];

  let html = "<ul class='field-list'>";
  rows.forEach(function(row) {
    html += "<li><span class='field-name'>" + row[0] + "</span><span class='field-value'>" + row[1] + "</span></li>";
  });
  html += "</ul>";

  summary.innerHTML = html;
}