// ================================================================
// SHARED REQUEST STORE
// This is the fake "backend" for the multi-persona demo. Every
// persona page (requestor, assessor, financial-controller, ...)
// loads/saves the SAME localStorage key, so moving a request
// forward on one page makes it show up on the next page the
// moment you open it in this browser.
//
// When the real CAP backend exists, everything in this file is
// what gets replaced by actual API calls — the rest of the pages
// shouldn't need to change much since they only ever talk to the
// functions below, never to localStorage directly.
// ================================================================

const REQUESTS_KEY = "btp_requests_v1";

const PERSONA_ORDER = ["assessor", "financialController", "technicalArchitect", "btpcoeHead", "admin"];

const PERSONA_LABELS = {
  assessor: "Assessor",
  financialController: "Financial Controller",
  technicalArchitect: "Technical Architect",
  btpcoeHead: "BTPCOE Head",
  admin: "Admin"
};

const PERSONA_INITIALS = {
  assessor: "AS",
  financialController: "FC",
  technicalArchitect: "TA",
  btpcoeHead: "BH",
  admin: "AD"
};

const PERSONA_PAGES = {
  assessor: "assessor.html",
  financialController: "financial-controller.html",
  technicalArchitect: "technical-architect.html",
  btpcoeHead: "btpcoe-head.html",
  admin: "admin.html"
};

const CATEGORY_LABELS = {
  "subaccount-creation": "Subaccount Creation",
  "directory-creation": "Directory Creation",
  "subaccount-name-change": "Subaccount Name Change",
  "use-case-initiation": "Use Case Initiation",
  "entitlement-configuration": "Entitlement Configuration",
  "role-access": "Role Access in SAP BTP",
  "other": "Other"
};

const REGION_LABELS = {
  "ap-mumbai": "Asia Pacific (Mumbai)",
  "ap-singapore": "Asia Pacific (Singapore)",
  "eu-frankfurt": "Europe (Frankfurt)",
  "us-east": "US East (Virginia)",
  "us-west": "US West (Oregon)"
};

// ----------------------------------------------------------------
// ID generation — mock alphanumeric IDs like REQ-2026-K7P2QX
// ----------------------------------------------------------------
function generateRequestId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skips look-alike chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return "REQ-2026-" + code;
}

function todayLabel() {
  return new Date().toISOString().slice(0, 10);
}

// ----------------------------------------------------------------
// localStorage read/write
// ----------------------------------------------------------------
function loadRequests() {
  const raw = localStorage.getItem(REQUESTS_KEY);
  if (!raw) {
    const seed = seedRequests();
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveAllRequests(list) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
}

function saveRequest(updated) {
  const all = loadRequests();
  const idx = all.findIndex(function (r) { return r.id === updated.id; });
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.unshift(updated);
  }
  saveAllRequests(all);
}

function getRequestById(id) {
  return loadRequests().find(function (r) { return r.id === id; }) || null;
}

// Wipes the demo data back to the seed set — handy if a demo run gets messy.
function resetRequestStore() {
  localStorage.removeItem(REQUESTS_KEY);
  return loadRequests();
}

// ----------------------------------------------------------------
// Stage / status helpers
// ----------------------------------------------------------------
function emptyStage() {
  return { state: "pending", decision: null, comment: "", actedOn: null, sentBack: false };
}

function newStagesBlock() {
  return {
    assessor: emptyStage(),
    financialController: emptyStage(),
    technicalArchitect: emptyStage(),
    btpcoeHead: emptyStage(),
    admin: emptyStage()
  };
}

function recordComment(request, personaKey, decisionLabel, commentText) {
  if (commentText && commentText.trim() !== "") {
    request.comments.push({
      persona: personaKey,
      name: PERSONA_LABELS[personaKey] || personaKey,
      date: todayLabel(),
      text: commentText.trim(),
      decision: decisionLabel
    });
  }
}

function recordAttachment(request, fileName, uploadedByPersona) {
  if (!fileName) return;
  request.attachments.push({
    name: fileName,
    uploadedBy: PERSONA_LABELS[uploadedByPersona] || uploadedByPersona,
    uploadedOn: todayLabel()
  });
}

// Moves a request forward to the next persona after an approval.
function advanceRequest(request, fromPersona, toPersona) {
  request.stages[fromPersona].state = "approved";
  request.stages[fromPersona].decision = "approved";
  request.stages[fromPersona].actedOn = todayLabel();
  request.currentPersona = toPersona;
  request.status = "in-progress";
}

// Terminates a request — no further movement possible.
function rejectRequestStage(request, fromPersona) {
  request.stages[fromPersona].state = "rejected";
  request.stages[fromPersona].decision = "rejected";
  request.stages[fromPersona].actedOn = todayLabel();
  request.status = "rejected";
}

// Bounces a request back to an earlier persona for rework.
function sendBackRequest(request, fromPersona, toPersona) {
  request.stages[fromPersona].state = "pending";
  request.stages[fromPersona].decision = "sent-back";
  request.stages[fromPersona].actedOn = todayLabel();
  request.stages[toPersona].sentBack = true;
  request.stages[toPersona].state = "pending";
  request.currentPersona = toPersona;
  request.status = "in-progress";
}

// Marks the very last stage (Admin) as complete.
function completeRequest(request, fromPersona) {
  request.stages[fromPersona].state = "approved";
  request.stages[fromPersona].decision = "approved";
  request.stages[fromPersona].actedOn = todayLabel();
  request.status = "approved";
}

// ----------------------------------------------------------------
// Progress stepper — renders the Assessor -> ... -> Admin tracker
// (green check = approved, orange check = approved after a
// send-back, red cross = rejected, blue = current/active stage)
// ----------------------------------------------------------------
function renderStepper(request) {
  const order = PERSONA_ORDER;
  const currentIndex = order.indexOf(request.currentPersona);
  const isRejected = request.status === "rejected";
  const isComplete = request.status === "approved";
  let rejectedIndex = -1;
  if (isRejected) {
    rejectedIndex = order.findIndex(function (p) { return request.stages[p].decision === "rejected"; });
  }

  let html = '<div class="stepper">';
  order.forEach(function (persona, i) {
    const stage = request.stages[persona];
    let circleClass = "stepper-circle";
    let icon = String(i + 1);
    let stateLabel = "Pending";
    let stateDate = "";

    if (isRejected && i === rejectedIndex) {
      circleClass += " stepper-circle--rejected";
      icon = "&#10005;";
      stateLabel = "Rejected";
      stateDate = stage.actedOn || "";
    } else if (isRejected && i > rejectedIndex) {
      circleClass += " stepper-circle--void";
      stateLabel = "Not Reached";
    } else if (i < currentIndex || (isComplete && i <= currentIndex)) {
      icon = "&#10003;";
      stateDate = stage.actedOn || "";
      if (stage.sentBack) {
        circleClass += " stepper-circle--sentback";
        stateLabel = "Approved (after send-back)";
      } else {
        circleClass += " stepper-circle--done";
        stateLabel = "Approved";
      }
    } else if (i === currentIndex && !isComplete) {
      circleClass += " stepper-circle--active";
      stateLabel = "(You are here) Pending";
    } else if (i > currentIndex && stage.decision === "sent-back") {
      // This persona is the one who just bounced the request backward —
      // the pointer has already moved behind them, so without this branch
      // they'd fall through to a plain numbered "Pending" circle with no
      // indication they ever acted on it.
      circleClass += " stepper-circle--sentback";
      icon = "&#8617;";
      stateLabel = "Sent Back";
      stateDate = stage.actedOn || "";
    }

    html += '<div class="stepper-step">';
    html += '<div class="' + circleClass + '">' + icon + '</div>';
    html += '<div class="stepper-label">';
    html += '<span class="stepper-name">' + PERSONA_LABELS[persona] + '</span>';
    html += '<span class="stepper-state">' + stateLabel + '</span>';
    if (stateDate) html += '<span class="stepper-date">' + stateDate + '</span>';
    html += '</div></div>';
    if (i < order.length - 1) html += '<div class="stepper-connector"></div>';
  });
  html += '</div>';
  return html;
}

// ----------------------------------------------------------------
// Comments + attachments panel (the "Previous Approver Comments"
// / "Attachments" two-column block)
// ----------------------------------------------------------------
function renderCommentsAndAttachments(request) {
  let commentsHtml = "";
  if (request.comments.length === 0) {
    commentsHtml = '<p class="empty-state" style="padding:16px 0;">No comments yet.</p>';
  } else {
    request.comments.slice().reverse().forEach(function (c) {
      const isRejectedComment = c.decision === "rejected";
      const isSentBackComment = c.decision === "sent-back";
      let iconClass = "comment-icon--approve";
      let icon = "&#10003;";
      if (isRejectedComment) { iconClass = "comment-icon--reject"; icon = "&#10005;"; }
      else if (isSentBackComment) { iconClass = "comment-icon--sentback"; icon = "&#8617;"; }
      commentsHtml += '<div class="approver-comment">';
      commentsHtml += '<div class="approver-comment-head"><strong>' + c.name + '</strong><span>' + c.date + '</span>';
      commentsHtml += '<span class="comment-icon ' + iconClass + '">' + icon + '</span></div>';
      commentsHtml += '<p>' + c.text + '</p>';
      commentsHtml += '</div>';
    });
  }

  let attachmentsHtml = "";
  if (request.attachments.length === 0) {
    attachmentsHtml = '<p class="empty-state" style="padding:16px 0;">No attachments.</p>';
  } else {
    request.attachments.forEach(function (a) {
      attachmentsHtml += '<div class="attachment-row">';
      attachmentsHtml += '<span class="attachment-name">&#128206; ' + a.name + '</span>';
      attachmentsHtml += '<span class="attachment-meta">Uploaded by ' + a.uploadedBy + ' &middot; ' + a.uploadedOn + '</span>';
      attachmentsHtml += '</div>';
    });
  }

  return (
    '<div class="detail-columns">' +
      '<div class="detail-column"><h3 class="detail-column-title">Previous Comments</h3>' + commentsHtml + '</div>' +
      '<div class="detail-column"><h3 class="detail-column-title">Attachments (' + request.attachments.length + ')</h3>' + attachmentsHtml + '</div>' +
    '</div>'
  );
}

// ----------------------------------------------------------------
// Read-only "Request Details" card shared by every persona page
// ----------------------------------------------------------------
function renderRequestDetailsCard(r) {
  return (
    '<div class="review-card">' +
      '<div class="review-card-header"><span>&#128196;</span><span>Request Details</span></div>' +
      '<div class="review-card-body">' +
        rowHtml("Request ID", r.id) +
        rowHtml("Category", CATEGORY_LABELS[r.category] || r.category) +
        rowHtml("Priority", r.priority) +
        rowHtml("Title", r.title) +
        rowHtml("Required By", r.requiredByDate) +
        rowHtml("Business Unit", r.businessUnit) +
        rowHtml("Department", r.department) +
        rowHtml("Business Justification", r.businessJustification, true) +
      '</div>' +
    '</div>' +
    '<div class="review-card">' +
      '<div class="review-card-header"><span>&#9729;</span><span>Service Configuration</span></div>' +
      '<div class="review-card-body">' +
        rowHtml("Subaccount Name", r.subaccountName) +
        rowHtml("Parent Global Account", r.parentGlobalAccount) +
        rowHtml("Region", REGION_LABELS[r.region] || r.region) +
        rowHtml("Business Owner", r.businessOwner) +
        rowHtml("Environment", r.environment) +
        rowHtml("Estimated Users", r.estimatedUsers) +
      '</div>' +
    '</div>'
  );
}

// ----------------------------------------------------------------
// FC summary card — shown on TA and BTPCOE Head pages
// ----------------------------------------------------------------
function renderFCSummaryCard(r) {
  var fc = r.stages.financialController;
  if (!fc || !fc.monthlyCost) return ""; // FC was not part of this request's path
  return (
    '<div class="review-card">' +
      '<div class="review-card-header"><span>&#128176;</span><span>Financial Controller Assessment</span></div>' +
      '<div class="review-card-body">' +
        rowHtml("Monthly Cost (INR)", fc.monthlyCost) +
        rowHtml("Annual Cost (INR)", fc.annualCost) +
        rowHtml("Cost Center", fc.costCenter) +
        rowHtml("Budget Reference", fc.budgetRef) +
        rowHtml("Budget Approval", fc.budgetApproval === "yes" ? "Yes" : fc.budgetApproval === "no" ? "No" : "—") +
      '</div>' +
    '</div>'
  );
}

function rowHtml(label, value, fullWidth) {
  return '<div class="review-row' + (fullWidth ? ' review-row--full' : '') + '"><span class="review-row-label">' + label + '</span><span class="review-row-value">' + (value || "—") + '</span></div>';
}

function renderTASummaryCard(r) {
  var ta = r.stages.technicalArchitect;
  if (!ta || !ta.securityImpact) return "";
  return (
    '<div class="review-card">' +
      '<div class="review-card-header"><span>&#128736;</span><span>Technical Architect Assessment</span></div>' +
      '<div class="review-card-body">' +
        rowHtml("Security Impact", ta.securityImpact) +
        rowHtml("Operational Impact", ta.operationalImpact) +
        rowHtml("Data Privacy Impact", ta.dataPrivacyImpact) +
        (ta.delegateTo ? rowHtml("Delegated To", ta.delegateTo) : "") +
        (ta.notes ? rowHtml("Technical Notes", ta.notes) : "") +
      '</div>' +
    '</div>'
  );
}

function renderBHSummaryCard(r) {
  var bh = r.stages.btpcoeHead;
  if (!bh || !bh.decision) return "";
  return (
    '<div class="review-card">' +
      '<div class="review-card-header"><span>&#127970;</span><span>BTPCOE Head Assessment</span></div>' +
      '<div class="review-card-body">' +
        rowHtml("Decision", bh.decision) +
        (bh.delegateTo ? rowHtml("Delegated To", bh.delegateTo) : "") +
      '</div>' +
    '</div>'
  );
}

// ----------------------------------------------------------------
// Seed data — gives every persona's queue something to demo with
// on first load, before anyone has submitted a real request.
// ----------------------------------------------------------------
function seedRequests() {
  const r1Stages = newStagesBlock();

  const r2Stages = newStagesBlock();
  r2Stages.assessor.state = "approved";
  r2Stages.assessor.decision = "approved";
  r2Stages.assessor.actedOn = "2026-06-17";
  r2Stages.assessor.costImpact = "yes";

  return [
    {
      id: "REQ-2026-K7P2QX",
      title: "Request for Development Subaccount",
      category: "subaccount-creation",
      priority: "high",
      requiredByDate: "2026-06-25",
      businessJustification: "Need an isolated subaccount for AI Core development and testing workloads.",
      businessUnit: "sap-coe",
      department: "technology",
      subaccountName: "DEV-SUB-01",
      parentGlobalAccount: "sapcoe-global",
      region: "ap-mumbai",
      businessOwner: "Sindhu R",
      environment: "cloud-foundry",
      estimatedUsers: "12",
      requestedBy: "Sindhu R",
      createdOn: "2026-06-18",
      status: "pending",
      currentPersona: "assessor",
      stages: r1Stages,
      comments: [],
      attachments: [
        { name: "Business_Justification.pdf", uploadedBy: "Sindhu R", uploadedOn: "2026-06-18" }
      ]
    },
    {
      id: "REQ-2026-7M3VWQ",
      title: "Entitlement Increase — AI Core",
      category: "entitlement-configuration",
      priority: "medium",
      requiredByDate: "2026-06-23",
      businessJustification: "Existing entitlement quota is insufficient for the new document-AI use case.",
      businessUnit: "technology",
      department: "technology",
      subaccountName: "AI-CORE-PROD",
      parentGlobalAccount: "prod-global",
      region: "eu-frankfurt",
      businessOwner: "Rahul Mehta",
      environment: "kyma",
      estimatedUsers: "40",
      requestedBy: "Rahul Mehta",
      createdOn: "2026-06-16",
      status: "in-progress",
      currentPersona: "financialController",
      stages: r2Stages,
      comments: [
        { persona: "assessor", name: "Assessor", date: "2026-06-17", text: "Cost impact identified — routing to Financial Controller for budget review.", decision: "approved" }
      ],
      attachments: [
        { name: "Architecture_Diagram.png", uploadedBy: "Rahul Mehta", uploadedOn: "2026-06-16" }
      ]
    }
  ];
}
