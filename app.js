// ============================================================
//  NEU Library Visitor Log — app.js
//  Supabase + Google OAuth
// ============================================================

const SUPABASE_URL = "https://axnlinuccahemeppqkae.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bmxpbnVjY2FoZW1lcHBxa2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDM3ODcsImV4cCI6MjA4OTYxOTc4N30.7udhzS79oP-GXTj510j9fV8LA9Uu9bbQvrZ-uK0OKiI";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Admin emails (add more as needed) ───────────────────────
const ADMIN_EMAILS = ["admin@neu.edu.ph", "library@neu.edu.ph"];

// ── State ────────────────────────────────────────────────────
let currentUser = null;
let isAdminMode = false;
let chartInstance = null;
let realtimeChannel = null;

// ============================================================
//  COURSE MAP
// ============================================================
const courseMap = {
  COAc: ["BS Accountancy", "BS Management Accounting"],
  COAg: ["BS Agriculture", "BS Agricultural Engineering"],
  CAS:  ["BS Biology", "BS Psychology", "BA Communication", "AB English", "BS Mathematics", "BS Chemistry"],
  CBA:  ["BS Business Administration", "BS Entrepreneurship", "BS Office Administration"],
  COC:  ["AB Communication", "BS Journalism", "BS Broadcasting"],
  CICS: ["BS Computer Science", "BS Information Technology", "BS Information Systems"],
  COCC: ["BS Criminology"],
  CED:  ["BEEd", "BSEd - English", "BSEd - Mathematics", "BSEd - Science", "BSEd - Filipino", "BSEd - MAPEH"],
  CEA:  ["BS Civil Engineering", "BS Electrical Engineering", "BS Electronics Engineering", "BS Architecture", "BS Mechanical Engineering"],
  CMT:  ["BS Medical Technology"],
  CM:   ["BS Midwifery"],
  COM:  ["BS Music", "BA Music"],
  CON:  ["BS Nursing"],
  CPT:  ["BS Physical Therapy"],
  CRT:  ["BS Respiratory Therapy"],
  SOIR: ["BS International Relations", "BA Political Science"],
  SGS:  ["Master of Arts", "Master of Science", "Doctor of Philosophy"],
  STAFF:   ["N/A"],
  Visitor: ["N/A"],
};

function populateCourses(collegeSelectId, courseSelectId) {
  const college = document.getElementById(collegeSelectId).value;
  const courseSelect = document.getElementById(courseSelectId);
  courseSelect.innerHTML = '<option value="" disabled selected>Select Program / Course</option>';
  (courseMap[college] || []).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    courseSelect.appendChild(opt);
  });
}

function updateCourses()    { populateCourses("college-select", "course-select"); }
function updateRegCourses() { populateCourses("reg-college",    "reg-course"); }

// ============================================================
//  UI HELPERS
// ============================================================
function showLoading(on) {
  document.getElementById("loading-overlay").classList.toggle("hidden", !on);
}

function toast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 400); }, 3000);
}

function showLogin() {
  document.getElementById("register-container").classList.add("hidden");
  document.getElementById("login-container").classList.remove("hidden");
}

function showRegister() {
  document.getElementById("login-container").classList.add("hidden");
  document.getElementById("register-container").classList.remove("hidden");
}

function switchLoginMode(mode) {
  isAdminMode = mode === "admin";
  document.getElementById("btn-reg").classList.toggle("active", !isAdminMode);
  document.getElementById("btn-adm").classList.toggle("active",  isAdminMode);

  const hint   = document.getElementById("login-hint");
  const google = document.getElementById("google-btn");
  const regLink = document.getElementById("register-link-wrap");

  if (isAdminMode) {
    hint.textContent = "Admin access only. Use your admin credentials.";
    google.classList.add("hidden");
    regLink.classList.add("hidden");
  } else {
    hint.textContent = "Enter your institutional email to proceed.";
    google.classList.remove("hidden");
    regLink.classList.remove("hidden");
  }
}

// ============================================================
//  AUTH — LOGIN / REGISTER / GOOGLE
// ============================================================
async function handleLogin() {
  const email = document.getElementById("email-input").value.trim();
  const pass  = document.getElementById("pass-input").value;
  if (!email || !pass) return toast("Please enter email and password.", "error");

  showLoading(true);
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  showLoading(false);

  if (error) return toast(error.message, "error");

  const user = data.user;
  const admin = ADMIN_EMAILS.includes(user.email) || isAdminMode;
  enterApp(user, admin);
}

async function handleGoogleLogin() {
  showLoading(true);
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
  showLoading(false);
  if (error) toast(error.message, "error");
}

async function handleRegister() {
  const name    = document.getElementById("reg-name").value.trim();
  const email   = document.getElementById("reg-email").value.trim();
  const idNum   = document.getElementById("reg-id").value.trim();
  const college = document.getElementById("reg-college").value;
  const course  = document.getElementById("reg-course").value;
  const pass    = document.getElementById("reg-pass").value;
  const confirm = document.getElementById("reg-confirm").value;

  if (!name || !email || !idNum || !college || !course || !pass)
    return toast("Please fill in all fields.", "error");
  if (pass.length < 6)
    return toast("Password must be at least 6 characters.", "error");
  if (pass !== confirm)
    return toast("Passwords do not match.", "error");

  showLoading(true);
  const { data, error } = await sb.auth.signUp({
    email,
    password: pass,
    options: {
      data: { full_name: name, id_number: idNum, college, course },
    },
  });
  showLoading(false);

  if (error) return toast(error.message, "error");

  // Also save profile to `profiles` table (optional but recommended)
  if (data.user) {
    await sb.from("profiles").upsert({
      id:        data.user.id,
      full_name: name,
      id_number: idNum,
      college,
      course,
      email,
    });
  }

  toast("Account created! Please check your email to confirm.", "success");
  showLogin();
}

// ============================================================
//  SESSION RESTORE (OAuth redirect / page reload)
// ============================================================
async function restoreSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;

  const user  = session.user;
  const admin = ADMIN_EMAILS.includes(user.email);

  // Pre-fill form from user metadata if available
  const meta = user.user_metadata || {};
  if (meta.full_name) document.getElementById("v-name").value = meta.full_name;
  if (meta.id_number) document.getElementById("v-id").value   = meta.id_number;

  enterApp(user, admin);
}

// ============================================================
//  ENTER APP
// ============================================================
function enterApp(user, isAdmin) {
  currentUser = user;

  document.getElementById("login-container").classList.add("hidden");
  document.getElementById("register-container").classList.add("hidden");
  document.getElementById("top-switcher").classList.add("hidden");
  document.getElementById("app-content").style.display = "block";

  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email;

  document.getElementById("welcome-msg").textContent =
    `Welcome, ${name}!`;

  if (isAdmin) {
    document.getElementById("view-title").textContent = "Admin Dashboard";
    document.getElementById("visitor-form").classList.add("hidden");
    document.getElementById("admin-dashboard").classList.remove("hidden");
    startClock();
    loadAdminData();
    subscribeRealtime();
  } else {
    document.getElementById("view-title").textContent = "Visitor Entry Form";
    document.getElementById("visitor-form").classList.remove("hidden");
    document.getElementById("admin-dashboard").classList.add("hidden");

    // Pre-fill from metadata
    if (meta.full_name) document.getElementById("v-name").value = meta.full_name;
    if (meta.id_number) document.getElementById("v-id").value   = meta.id_number;
  }
}

// ============================================================
//  VISITOR FORM SUBMIT
// ============================================================
async function submitLog() {
  const name    = document.getElementById("v-name").value.trim();
  const idNum   = document.getElementById("v-id").value.trim();
  const college = document.getElementById("college-select").value;
  const course  = document.getElementById("course-select").value;
  const type    = document.getElementById("visitor-type").value;
  const reason  = document.getElementById("v-reason").value;

  if (!name || !idNum || !college || !course || !type || !reason)
    return toast("Please fill in all fields.", "error");

  showLoading(true);
  const { error } = await sb.from("visitor_logs").insert([{
    full_name:    name,
    id_number:    idNum,
    college,
    course,
    visitor_type: type,
    reason,
    user_id:      currentUser?.id || null,
    time_in:      new Date().toISOString(),
  }]);
  showLoading(false);

  if (error) return toast("Failed to submit: " + error.message, "error");

  toast("Entry submitted successfully! ✅");

  // Clear form (keep name & id)
  document.getElementById("college-select").selectedIndex = 0;
  document.getElementById("course-select").innerHTML =
    '<option value="" disabled selected>Select Program/Course</option>';
  document.getElementById("visitor-type").selectedIndex = 0;
  document.getElementById("v-reason").selectedIndex = 0;
}

// ============================================================
//  LOGOUT
// ============================================================
async function logoutUser() {
  await sb.auth.signOut();
  location.reload();
}

async function logoutAdmin() {
  if (realtimeChannel) sb.removeChannel(realtimeChannel);
  await sb.auth.signOut();
  location.reload();
}

// ============================================================
//  ADMIN — LOAD DATA
// ============================================================
async function loadAdminData() {
  const filterDate    = document.getElementById("filter-date").value;
  const filterCollege = document.getElementById("filter-college").value;
  const filterReason  = document.getElementById("filter-reason").value;

  // Default to today if no date picked
  const dateStr = filterDate || new Date().toISOString().split("T")[0];

  let query = sb.from("visitor_logs")
    .select("*")
    .gte("time_in", `${dateStr}T00:00:00`)
    .lte("time_in", `${dateStr}T23:59:59`)
    .order("time_in", { ascending: false });

  if (filterCollege !== "all") query = query.eq("college", filterCollege);
  if (filterReason  !== "all") query = query.eq("reason",  filterReason);

  const { data, error } = await query;
  if (error) return toast("Error loading data: " + error.message, "error");

  renderTable(data || []);
  renderStats(data || [], dateStr);
  renderChart(data || []);
}

function renderTable(rows) {
  const tbody = document.getElementById("visitor-tbody");
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;opacity:0.6;">No records found.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${formatTime(r.time_in)}</td>
      <td>${r.full_name}</td>
      <td>${r.id_number}</td>
      <td>${r.college}</td>
      <td>${r.course}</td>
      <td>${r.visitor_type}</td>
      <td>${r.reason}</td>
    </tr>
  `).join("");
}

function renderStats(rows, dateStr) {
  document.getElementById("total-v-count").textContent = rows.length;
  document.getElementById("current-date-display").textContent =
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Peak hour
  const hourCounts = {};
  rows.forEach(r => {
    const h = new Date(r.time_in).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peak = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("peak-hours-display").textContent =
    peak ? formatHour(+peak[0]) : "N/A";
}

function renderChart(rows) {
  const hourCounts = Array(24).fill(0);
  rows.forEach(r => hourCounts[new Date(r.time_in).getHours()]++);

  const labels = hourCounts.map((_, i) => formatHour(i));
  const ctx    = document.getElementById("statChart").getContext("2d");

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Visitors per Hour",
        data:  hourCounts,
        backgroundColor: "rgba(0, 212, 255, 0.5)",
        borderColor:     "#00d4ff",
        borderWidth: 1,
        borderRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "white" } } },
      scales: {
        x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
        y: { ticks: { color: "white", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.1)" } },
      },
    },
  });
}

// ============================================================
//  REALTIME SUBSCRIPTION
// ============================================================
function subscribeRealtime() {
  realtimeChannel = sb
    .channel("visitor_logs_realtime")
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "visitor_logs" },
      () => loadAdminData()
    )
    .subscribe();
}

// ============================================================
//  CLOCK
// ============================================================
function startClock() {
  const el = document.getElementById("live-clock");
  function tick() {
    el.textContent = new Date().toLocaleString("en-PH", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }
  tick();
  setInterval(tick, 1000);
}

// ============================================================
//  PDF DOWNLOAD
// ============================================================
async function downloadPDF() {
  const filterDate = document.getElementById("filter-date").value ||
    new Date().toISOString().split("T")[0];

  const { data, error } = await sb.from("visitor_logs")
    .select("*")
    .gte("time_in", `${filterDate}T00:00:00`)
    .lte("time_in", `${filterDate}T23:59:59`)
    .order("time_in", { ascending: true });

  if (error) return toast("Error fetching records.", "error");
  if (!data.length) return toast("No records to download.", "error");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("NEU Library Visitor Log", 14, 15);
  doc.setFontSize(10);
  doc.text(`Date: ${filterDate}`, 14, 22);
  doc.text(`Total Visitors: ${data.length}`, 14, 28);

  doc.autoTable({
    startY: 33,
    head: [["Time-In", "Full Name", "ID Number", "College", "Program/Course", "Type", "Reason"]],
    body: data.map(r => [
      formatTime(r.time_in), r.full_name, r.id_number,
      r.college, r.course, r.visitor_type, r.reason,
    ]),
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 51, 102] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });

  doc.save(`NEU_Library_Visitors_${filterDate}.pdf`);
  toast("PDF downloaded! ✅");
}

// ============================================================
//  UTILITIES
// ============================================================
function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH",
    { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatHour(h) {
  const suffix = h < 12 ? "AM" : "PM";
  const hour   = h % 12 || 12;
  return `${hour}:00 ${suffix}`;
}

// ============================================================
//  INIT
// ============================================================
window.addEventListener("DOMContentLoaded", async () => {
  // Set today's date as default filter
  const today = new Date().toISOString().split("T")[0];
  const filterDateEl = document.getElementById("filter-date");
  if (filterDateEl) filterDateEl.value = today;

  // Listen for auth state changes (handles OAuth redirect)
  sb.auth.onAuthStateChange((_event, session) => {
    if (session && !currentUser) {
      const user  = session.user;
      const admin = ADMIN_EMAILS.includes(user.email);
      enterApp(user, admin);
    }
  });

  // Restore existing session
  await restoreSession();
});
