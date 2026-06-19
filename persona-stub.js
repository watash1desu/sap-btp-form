// ================================================================
// PHASE-2 STUB PAGE LOGIC
// Shared by Technical Architect / BTPCOE Head / Admin pages until
// their real decision forms are built. Shows the request landed
// here correctly (stepper, comments, attachments) but offers no
// way to act on it yet.
// Each HTML file sets window.STUB_PERSONA_KEY before loading this.
// ================================================================

const PERSONA_KEY = window.STUB_PERSONA_KEY;
let dashFilter = "all";

function showDashboard() {
  renderDashboard();
}

function filterDashboard(status) {
  dashFilter = status;
  document.querySelectorAll(".dash-card").forEach(function (c) { c.classList.toggle("active-filter", c.getAttribute("data-filter") === status); });
  document.getElementById("active-filter-label").textContent = status === "all" ? "Showing all" : "Showing " + status.replace("-", " ");
  renderDashboard();
}

function renderDashboard() {
  const all = loadRequests();
  const counts = { all: all.length, pending: 0, "in-progress": 0, approved: 0, rejected: 0 };
  all.forEach(function (r) { if (counts[r.status] !== undefined) counts[r.status]++; });
  document.getElementById("count-all").textContent = counts.all;
  document.getElementById("count-pending").textContent = counts.pending;
  document.getElementById("count-inprogress").textContent = counts["in-progress"];
  document.getElementById("count-approved").textContent = counts.approved;
  document.getElementById("count-rejected").textContent = counts.rejected;

  const myQueueCount = all.filter(function (r) { return r.currentPersona === PERSONA_KEY && r.status !== "rejected" && r.status !== "approved"; }).length;
  document.getElementById("queue-count").textContent = myQueueCount;

  const filtered = dashFilter === "all" ? all : all.filter(function (r) { return r.status === dashFilter; });
  const list = document.getElementById("requests-list");
  if (filtered.length === 0) { list.innerHTML = "<li class='empty-state'>No requests found.</li>"; return; }

  let html = "";
  filtered.forEach(function (r) {
    const isMine = r.currentPersona === PERSONA_KEY && r.status !== "rejected" && r.status !== "approved";
    html += "<li class='request-row request-row--clickable' onclick=\"openDetail('" + r.id + "')\">";
    html += "<span class='request-meta' style='width:120px; font-weight:600; color:#22242a;'>" + r.id + (isMine ? " &#9679;" : "") + "</span>";
    html += "<div class='request-info'><span class='request-title'>" + r.title + "</span><span class='request-meta'>" + (CATEGORY_LABELS[r.category] || "—") + "</span></div>";
    html += "<span class='request-priority priority--" + r.priority + "'>" + r.priority + "</span>";
    html += "<span class='request-due-date'>&#128197; " + r.requiredByDate + "</span>";
    html += "<span class='status-cell'><span class='status-badge status-badge--" + r.status + "'>" + r.status.replace("-", " ") + "</span></span>";
    html += "</li>";
  });
  list.innerHTML = html;
}

function openDetail(id) {
  const r = getRequestById(id);
  if (!r) return;
  document.getElementById("dashboard-view").classList.remove("active");
  document.getElementById("detail-view").classList.add("active");

  const isMine = r.currentPersona === PERSONA_KEY && r.status !== "rejected" && r.status !== "approved";
  const banner = isMine
    ? '<div class="stub-banner">&#9888; This request is waiting on ' + PERSONA_LABELS[PERSONA_KEY] + '. The full decision form for this persona is coming in the next build phase — for now this view is read-only.</div>'
    : '';

  document.getElementById("detail-readonly-content").innerHTML =
    banner +
    '<div class="detail-header"><div class="detail-header-top"><span class="detail-title">' + r.title + '</span><span class="priority-tag priority-tag--' + r.priority + '">' + r.priority + '</span></div>' +
    '<div class="detail-id-row"><span>' + r.id + '</span><span>Requested by ' + r.requestedBy + '</span><span>Due ' + r.requiredByDate + '</span><span>Created ' + r.createdOn + '</span></div></div>' +
    renderStepper(r) +
    renderCommentsAndAttachments(r) +
    '<div class="review-cards">' + renderRequestDetailsCard(r) + '</div>';
}

function backToDashboard() {
  document.getElementById("detail-view").classList.remove("active");
  document.getElementById("dashboard-view").classList.add("active");
}

renderDashboard();
