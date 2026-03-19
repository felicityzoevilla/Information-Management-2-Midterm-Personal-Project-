// ── Supabase Init ──────────────────────────────────────────────
const SUPABASE_URL  = 'https://auxwdymnfmbqhdcufeoc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eHdkeW1uZm1icWhkY3VmZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDI3MjYsImV4cCI6MjA4OTM3ODcyNn0.w4M7zdLwAHfyP1sMEbLS9E-oKOtV5mCkG9SRCic3H4M';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── State ──────────────────────────────────────────────────────
let selectedMode    = 'regular';
let chartInstance   = null;
let realtimeChannel = null;

// ── Courses Map ────────────────────────────────────────────────
const coursesByCollege = {
    "COAc": ["Bachelor of Science in Accountancy","Bachelor of Science in Accounting Information System"],
    "COAg": ["Bachelor of Science in Agriculture"],
    "CAS":  ["Bachelor of Arts in Economics","Bachelor of Arts in Political Science","Bachelor of Science in Biology","Bachelor of Science in Psychology","Bachelor of Public Administration"],
    "CBA":  ["Bachelor of Science in Business Administration Major in Financial Management","Bachelor of Science in Business Administration Major in Human Resource Development Management","Bachelor of Science in Business Administration Major in Legal Management","Bachelor of Science in Business Administration Major in Marketing Management","Bachelor of Science in Entrepreneurship","Bachelor of Science in Real Estate Management"],
    "COC":  ["Bachelor of Arts in Broadcasting","Bachelor of Arts in Communication","Bachelor of Arts in Journalism"],
    "ICS":  ["Bachelor of Library and Information Science","Bachelor of Science in Information Technology","Bachelor of Science in Computer Science","Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Digital Animation Technology","Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Game Development","Bachelor of Science in Information System"],
    "COCC": ["Bachelor of Science in Criminology"],
    "CED":  ["Bachelor of Elementary Education","Bachelor of Elementary Education with Specialization in Preschool Education","Bachelor of Elementary Education with Specialization in Special Education","Bachelor of Secondary Education Major in Music, Arts, and Physical Education","Bachelor of Secondary Education Major in English","Bachelor of Secondary Education Major in Filipino","Bachelor of Secondary Education Major in Mathematics","Bachelor of Secondary Education Major in Science","Bachelor of Secondary Education Major in Social Studies","Bachelor of Secondary Education Major in Technology and Livelihood Education"],
    "CEA":  ["Bachelor of Science in Architecture","Bachelor of Science in Astronomy","Bachelor of Science in Civil Engineering","Bachelor of Science in Electrical Engineering","Bachelor of Science in Electronics Engineering","Bachelor of Science in Industrial Engineering","Bachelor of Science in Mechanical Engineering"],
    "CMT":  ["Bachelor of Science in Medical Technology"],
    "CM":   ["Diploma in Midwifery"],
    "COM":  ["Bachelor of Music in Choral Conducting","Bachelor of Music in Music Education","Bachelor of Music in Piano","Bachelor of Music in Voice"],
    "CON":  ["Bachelor of Science in Nursing"],
    "CPT":  ["Bachelor of Science in Physical Therapy"],
    "CRT":  ["Bachelor of Science in Respiratory Therapy"],
    "SOIR": ["Bachelor of Arts in Foreign Service"],
    "SGS":  ["Doctor in Business Administration","Master in Business Administration","Master in Business Administration Major in Human Resource Management","Master in Business Administration Major in Organizational Development","Doctor of Philosophy in Education Major in Bilingual Education","Doctor of Philosophy in Education Major in Early Childhood Education","Doctor of Philosophy in Education Major in Educational Leadership","Doctor of Philosophy in Education Major in Educational Management","Doctor of Philosophy in Education Major in Guidance & Counseling","Doctor of Philosophy in Education Major in Instructional Leadership","Doctor of Philosophy in Education Major in Special Education and Inclusive Education","Master of Arts in Education Major in Early Childhood Education","Master of Arts in Education Major in Educational Management","Master of Arts in Education Major in Educational Psychology","Master of Arts in Education Major in Educational Technology","Master of Arts in Education Major in Environmental Education","Master of Arts in Education Major in Filipino","Master of Arts in Education Major in Guidance and Counseling","Master of Arts in Education Major in Language Education","Master of Arts in Education Major in Mathematics Education","Master of Arts in Education Major in Reading Education","Master of Arts in Education Major in Science Education","Master of Arts in Education Major in Social Science","Master of Arts in Education Major in Special Education and Inclusive Education"],
    "STAFF":   ["Staff"],
    "Visitor": ["Visitor"]
};

// ── Helpers ────────────────────────────────────────────────────
function showLoading(msg = '⏳ Please wait...') {
    const el = document.getElementById('loading-overlay');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3500);
}

function todayPH() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function formatTimePH(isoString) {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila'
    });
}

// ── UI ─────────────────────────────────────────────────────────
function switchLoginMode(mode) {
    selectedMode = mode;
    document.getElementById('btn-reg').classList.toggle('active', mode === 'regular');
    document.getElementById('btn-adm').classList.toggle('active', mode === 'admin');
    document.getElementById('login-title').innerText = mode === 'admin' ? 'Admin Portal' : 'New Era University Library Visitor Log';
    document.getElementById('login-hint').innerText  = mode === 'admin' ? 'Admin credentials required.' : 'Enter your institutional email to proceed.';
    document.getElementById('register-link-wrap').style.display = mode === 'admin' ? 'none' : '';
}

function showRegister() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
    document.getElementById('top-switcher').style.display = 'none';
}

function showLogin() {
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('top-switcher').style.display = '';
}

function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.innerText = 'Philippine Standard Time: ' + now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Manila'
        });
        document.getElementById('current-date-display').innerText = now.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila'
        });
    }
}
setInterval(updateTime, 1000);

function updateCourses() {
    const college = document.getElementById('college-select').value;
    const sel = document.getElementById('course-select');
    sel.innerHTML = '<option value="" disabled selected>Select Program/Course</option>';
    (coursesByCollege[college] || []).forEach(c => {
        const o = document.createElement('option');
        o.value = o.textContent = c;
        sel.appendChild(o);
    });
}

function updateRegCourses() {
    const college = document.getElementById('reg-college').value;
    const sel = document.getElementById('reg-course');
    sel.innerHTML = '<option value="" disabled selected>Select Program / Course</option>';
    (coursesByCollege[college] || []).forEach(c => {
        const o = document.createElement('option');
        o.value = o.textContent = c;
        sel.appendChild(o);
    });
}

// ── Register ───────────────────────────────────────────────────
async function handleRegister() {
    const name    = document.getElementById('reg-name').value.trim();
    const email   = document.getElementById('reg-email').value.trim().toLowerCase();
    const id_num  = document.getElementById('reg-id').value.trim();
    const college = document.getElementById('reg-college').value;
    const course  = document.getElementById('reg-course').value;
    const pass    = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!name || !email || !id_num || !college || !course || !pass || !confirm) {
        showToast('Please fill in all fields.', 'error'); return;
    }
    if (!email.endsWith('@neu.edu.ph')) {
        showToast('Please use your institutional email (@neu.edu.ph).', 'error'); return;
    }
    if (pass.length < 6) {
        showToast('Password must be at least 6 characters.', 'error'); return;
    }
    if (pass !== confirm) {
        showToast('Passwords do not match.', 'error'); return;
    }

    const btn = document.getElementById('register-btn');
    btn.disabled = true; btn.textContent = 'Creating account…';
    showLoading('Creating your account...');

    const { data, error } = await db.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name, id_number: id_num, college, course } }
    });

    if (error) {
        hideLoading(); btn.disabled = false; btn.textContent = 'Create Account';
        showToast('Registration failed: ' + error.message, 'error'); return;
    }

    const userId = data.user?.id;
    if (userId) {
        await db.from('user_profiles').insert([{
            id: userId, full_name: name, email, id_number: id_num, college, course
        }]);
    }

    hideLoading(); btn.disabled = false; btn.textContent = 'Create Account';
    showToast(`Account created! Welcome, ${name}. You may now log in. ✅`);

    ['reg-name','reg-email','reg-id','reg-pass','reg-confirm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('reg-college').value = '';
    document.getElementById('reg-course').innerHTML = '<option value="" disabled selected>Select Program / Course</option>';
    setTimeout(showLogin, 1500);
}

// ── Login ──────────────────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById('email-input').value.trim().toLowerCase();
    const pass  = document.getElementById('pass-input').value;
    if (!email || !pass) { showToast('Please enter credentials.', 'error'); return; }

    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'Logging in…';
    showLoading('Authenticating...');

    const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
    hideLoading(); btn.disabled = false; btn.textContent = 'Login';

    if (error || !data.user) { showToast('Invalid email or password.', 'error'); return; }

    if (selectedMode === 'admin') {
        const { data: adminRow } = await db.from('admin_users').select('email').eq('email', email).single();
        if (!adminRow) {
            showToast('You do not have admin privileges.', 'error');
            await db.auth.signOut(); return;
        }
        enterAdmin();
    } else {
        const { data: profile } = await db.from('user_profiles').select('*').eq('id', data.user.id).single();
        enterRegular(data.user.email, profile);
    }
}

// ── Google Login ───────────────────────────────────────────────
async function handleGoogleLogin() {
    const btn = document.getElementById('google-btn');
    btn.disabled = true;
    btn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18"> Redirecting…`;
    showLoading('Redirecting to Google...');

    // ✅ FIX 1: Save the selected mode (admin/regular) before Google redirects away
    localStorage.setItem('loginMode', selectedMode);

    const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.href
        }
    });

    hideLoading();
    btn.disabled = false;
    btn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18"> Sign in with Google`;

    if (error) showToast('Google sign-in failed: ' + error.message, 'error');
}

// ── Enter Views ────────────────────────────────────────────────
function enterRegular(email, profile) {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('visitor-form').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('welcome-msg').innerText = `Welcome, ${profile?.full_name || email}!`;
    document.getElementById('view-title').innerText  = 'Visitor Entry Form';

    if (profile) {
        document.getElementById('v-name').value = profile.full_name || '';
        document.getElementById('v-id').value   = profile.id_number || '';
        if (profile.college) {
            document.getElementById('college-select').value = profile.college;
            updateCourses();
            setTimeout(() => {
                if (profile.course) document.getElementById('course-select').value = profile.course;
            }, 100);
        }
    }
}

function enterAdmin() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('visitor-form').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    document.getElementById('view-title').innerText  = 'Admin Analytics Dashboard';
    document.getElementById('welcome-msg').innerText = 'System Administrator Access';
    document.getElementById('top-switcher').style.display = 'none';
    document.getElementById('filter-date').value = todayPH();
    updateTime();
    loadAdminData();
    subscribeRealtime();
}

async function logoutUser() { await db.auth.signOut(); location.reload(); }
async function logoutAdmin() {
    await db.auth.signOut();
    if (realtimeChannel) db.removeChannel(realtimeChannel);
    location.reload();
}

// ── Submit Visitor Log ─────────────────────────────────────────
async function submitLog() {
    const name    = document.getElementById('v-name').value.trim();
    const id_num  = document.getElementById('v-id').value.trim();
    const college = document.getElementById('college-select').value;
    const course  = document.getElementById('course-select').value;
    const type    = document.getElementById('visitor-type').value;
    const reason  = document.getElementById('v-reason').value;

    if (!name || !id_num || !college || !course || !type || !reason) {
        showToast('Please complete all fields.', 'error'); return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    showLoading('Saving your entry...');

    const { error } = await db.from('visitor_logs').insert([{
        full_name: name, id_number: id_num, college, course, visitor_type: type, reason
    }]);

    hideLoading(); btn.disabled = false; btn.textContent = 'Submit Entry';

    if (error) { showToast('Error: ' + error.message, 'error'); return; }

    showToast(`Entry saved! Welcome, ${name} 🎉`);
    document.getElementById('visitor-type').value = '';
    document.getElementById('v-reason').value = '';
}

// ── Admin Data ─────────────────────────────────────────────────
async function loadAdminData() {
    showLoading('Loading dashboard...');
    const dateVal = document.getElementById('filter-date').value || todayPH();
    const college = document.getElementById('filter-college').value;
    const reason  = document.getElementById('filter-reason').value;

    let query = db.from('visitor_logs').select('*')
        .gte('time_in', dateVal + 'T00:00:00')
        .lte('time_in', dateVal + 'T23:59:59')
        .order('time_in', { ascending: false });

    if (college !== 'all') query = query.eq('college', college);
    if (reason  !== 'all') query = query.eq('reason', reason);

    const { data, error } = await query;
    hideLoading();

    if (error) { showToast('Error loading data: ' + error.message, 'error'); return; }

    renderTable(data || []);
    renderStats(data || []);
    renderChart(data || []);
}

function renderTable(rows) {
    const tbody = document.getElementById('visitor-tbody');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;opacity:0.6;">No records found.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${formatTimePH(r.time_in)}</td>
            <td>${r.full_name}</td>
            <td>${r.id_number}</td>
            <td>${r.college}</td>
            <td>${r.course}</td>
            <td>${r.visitor_type}</td>
            <td>${r.reason}</td>
        </tr>`).join('');
}

function renderStats(rows) {
    document.getElementById('total-v-count').innerText = rows.length;
    const hourCounts = {};
    rows.forEach(r => {
        const h = new Date(r.time_in).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peak = Object.keys(hourCounts).sort((a, b) => hourCounts[b] - hourCounts[a])[0];
    document.getElementById('peak-hours-display').innerText = peak !== undefined
        ? `${parseInt(peak) % 12 || 12}:00 ${parseInt(peak) < 12 ? 'AM' : 'PM'}` : '—';
}

function renderChart(rows) {
    const ctx = document.getElementById('statChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    const hourLabels = [], hourData = [];
    for (let h = 7; h <= 19; h++) {
        hourLabels.push(`${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`);
        hourData.push(rows.filter(r => new Date(r.time_in).getHours() === h).length);
    }
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hourLabels,
            datasets: [{
                label: 'Hourly Visitors',
                data: hourData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0,212,255,0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { ticks: { color: 'white', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: 'white' },             grid: { color: 'rgba(255,255,255,0.1)' } }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}

// ── Realtime ───────────────────────────────────────────────────
function subscribeRealtime() {
    realtimeChannel = db.channel('visitor_logs_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitor_logs' }, payload => {
            showToast(`New visitor logged: ${payload.new.full_name}`);
            loadAdminData();
        })
        .subscribe();
}

// ── Google Redirect Handler ────────────────────────────────────
(async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;

    // ✅ FIX 2: Clean the ugly #access_token=... from the URL bar
    window.history.replaceState(null, '', window.location.pathname);

    const email = session.user.email;

    // ✅ FIX 3: Read the saved mode from before the Google redirect
    const savedMode = localStorage.getItem('loginMode') || 'regular';
    localStorage.removeItem('loginMode'); // clean up after reading

    if (savedMode === 'admin') {
        // Check if this Google account exists in admin_users table
        const { data: adminRow } = await db.from('admin_users')
            .select('email')
            .eq('email', email)
            .single();

        if (!adminRow) {
            showToast('You do not have admin privileges.', 'error');
            await db.auth.signOut();
            return;
        }
        enterAdmin();
        return;
    }

    // Regular user flow — fetch or create profile
    const meta = session.user.user_metadata;
    const { data: existingProfile } = await db.from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (!existingProfile) {
        await db.from('user_profiles').insert([{
            id:        session.user.id,
            full_name: meta.full_name || meta.name || email,
            email:     email,
            id_number: '',
            college:   '',
            course:    ''
        }]);
    }

    const profile = existingProfile || { full_name: meta.full_name || meta.name || email };
    enterRegular(email, profile);
})();
