/* ─────────────────────────────────────────────
   Classroom Score — Main App Controller
   ───────────────────────────────────────────── */

import { signIn, signOut, getCurrentUser, isAdmin, onAuthStateChange } from './auth.js';
import { getStudents, addStudent, deleteStudent } from './students.js';
import { awardPoints, getLeaderboard, resetAllPoints, CATEGORIES } from './points.js';
import { getRewards, addReward, deleteReward, redeemReward } from './shop.js';
import { inviteUser, listUsers, getAdminStats } from './admin.js';

// ── State ──
let currentUser = null;
let students = [];
let leaderboard = [];
let rewards = [];

// ── DOM Refs ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Screens
const loginScreen = $('#login-screen');
const dashboardScreen = $('#dashboard-screen');
const adminScreen = $('#admin-screen');
const projectorScreen = $('#projector-screen');
const modalOverlay = $('#modal-overlay');

// ── Init ──
async function init() {
    const { user } = await getCurrentUser();
    if (user) {
        currentUser = user;
        showDashboard();
    } else {
        showScreen('login');
    }
    bindEvents();
    onAuthStateChange((user) => {
        currentUser = user;
        if (!user) showScreen('login');
    });
}

// ── Screen Management ──
function showScreen(name) {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    $(`#${name}-screen`).classList.add('active');
}

async function showDashboard() {
    showScreen('dashboard');
    // Show admin button if admin
    const adminBtn = $('#nav-admin');
    if (isAdmin(currentUser)) {
        adminBtn.hidden = false;
    }
    await refreshAll();
}

// ── Event Binding ──
function bindEvents() {
    // Login form
    $('#login-form').addEventListener('submit', handleLogin);

    // Logout
    $('#nav-logout').addEventListener('click', handleLogout);

    // Tabs
    $$('.tab').forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Student actions
    $('#add-student-btn').addEventListener('click', showAddStudentModal);

    // Leaderboard
    $('#reset-points-btn').addEventListener('click', handleResetPoints);

    // Shop
    $('#add-reward-btn').addEventListener('click', showAddRewardModal);

    // Projector
    $('#nav-projector').addEventListener('click', showProjector);
    $('#projector-exit').addEventListener('click', () => showScreen('dashboard'));

    // Admin
    $('#nav-admin').addEventListener('click', showAdmin);
    $('#admin-back').addEventListener('click', () => {
        showScreen('dashboard');
        refreshAll();
    });
    $('#invite-user-btn').addEventListener('click', showInviteUserModal);
    $('#admin-reset-points').addEventListener('click', handleResetPoints);
    $('#admin-export').addEventListener('click', handleExportCSV);

    // Modal close
    $('#modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

// ── Auth Handlers ──
async function handleLogin(e) {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const errorEl = $('#login-error');
    const btn = $('#login-btn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    errorEl.hidden = true;

    const { user, error } = await signIn(email, password);

    if (error) {
        errorEl.textContent = error.message || 'Invalid email or password';
        errorEl.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Sign In';
        return;
    }

    currentUser = user;
    btn.disabled = false;
    btn.textContent = 'Sign In';
    $('#login-form').reset();
    showDashboard();
}

async function handleLogout() {
    await signOut();
    currentUser = null;
    showScreen('login');
}

// ── Tab Switching ──
function switchTab(tab) {
    $$('.tab').forEach((t) => t.classList.remove('active'));
    $$(`.tab-content`).forEach((c) => c.classList.remove('active'));
    $(`.tab[data-tab="${tab}"]`).classList.add('active');
    $(`#tab-${tab}`).classList.add('active');

    // Refresh data when switching tabs
    if (tab === 'leaderboard') renderLeaderboard();
    if (tab === 'shop') renderShop();
}

// ── Data Refresh ──
async function refreshAll() {
    try {
        [students, leaderboard, rewards] = await Promise.all([
            getStudents(),
            getLeaderboard(),
            getRewards(),
        ]);
        renderStudents();
        renderLeaderboard();
        renderShop();
    } catch (err) {
        toast('Failed to load data: ' + err.message, 'error');
    }
}

// ── Student Rendering ──
function renderStudents() {
    const container = $('#student-list');

    if (!students.length) {
        container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <span class="empty-state-icon">👩‍🎓</span>
        <p class="empty-state-text">No students yet. Add your first student!</p>
      </div>`;
        return;
    }

    container.innerHTML = students.map((s) => {
        const pointsClass = s.total_earned >= 20 ? 'high' : s.total_earned > 0 ? 'positive' : s.total_earned < 0 ? 'negative' : '';
        return `
      <div class="student-card" data-id="${s.id}">
        <button class="student-delete" onclick="app.deleteStudent('${s.id}', '${s.name}')" title="Remove student">🗑️</button>
        <div class="student-card-header">
          <span class="student-name">${escHtml(s.name)}</span>
          <div>
            <span class="student-points ${pointsClass}">${s.total_earned} pts</span>
            <div class="student-balance">💰 ${s.balance} spendable</div>
          </div>
        </div>
        <div class="student-actions">
          <button class="point-btn plus" onclick="app.quickPoint('${s.id}', 1)">+1</button>
          <button class="point-btn plus" onclick="app.quickPoint('${s.id}', 5)">+5</button>
          <button class="point-btn minus" onclick="app.quickPoint('${s.id}', -1)">-1</button>
          <button class="point-btn category" onclick="app.showCategoryModal('${s.id}', '${escAttr(s.name)}')">📋 Category</button>
          <button class="point-btn category" onclick="app.showRedeemModal('${s.id}', '${escAttr(s.name)}', ${s.balance})">🎁 Redeem</button>
        </div>
      </div>`;
    }).join('');
}

// ── Leaderboard Rendering ──
function renderLeaderboard() {
    const container = $('#leaderboard');

    if (!leaderboard.length) {
        container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🏅</span>
        <p class="empty-state-text">No students yet. Add students to see the leaderboard!</p>
      </div>`;
        return;
    }

    const maxPoints = Math.max(...leaderboard.map((s) => s.total_earned), 1);

    container.innerHTML = leaderboard.map((s, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const rankDisplay = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        const barWidth = Math.max(0, (s.total_earned / maxPoints) * 100);
        return `
      <div class="leaderboard-row">
        <span class="leaderboard-rank ${rankClass}">${rankDisplay}</span>
        <span class="leaderboard-name">${escHtml(s.name)}</span>
        <div class="leaderboard-bar">
          <div class="leaderboard-bar-fill" style="width: ${barWidth}%"></div>
        </div>
        <span class="leaderboard-points">${s.total_earned} pts</span>
      </div>`;
    }).join('');
}

// ── Shop Rendering ──
function renderShop() {
    const container = $('#reward-list');

    if (!rewards.length) {
        container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <span class="empty-state-icon">🎁</span>
        <p class="empty-state-text">No rewards yet. Add rewards to stock the shop!</p>
      </div>`;
        return;
    }

    container.innerHTML = rewards.map((r) => `
    <div class="reward-card" data-id="${r.id}">
      <button class="reward-delete" onclick="app.deleteReward('${r.id}')" title="Remove reward">🗑️</button>
      <span class="reward-icon">${r.image_url || '🎁'}</span>
      <div class="reward-name">${escHtml(r.name)}</div>
      <div class="reward-cost">🪙 ${r.cost} pts</div>
      ${r.stock !== null ? `<div class="reward-stock">${r.stock} left in stock</div>` : ''}
    </div>
  `).join('');
}

// ── Projector Mode ──
function showProjector() {
    showScreen('projector');
    const container = $('#projector-leaderboard');

    container.innerHTML = leaderboard.map((s, i) => {
        const rankDisplay = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        const color = s.total_earned >= 20 ? 'var(--zone-gold)' :
            s.total_earned >= 10 ? 'var(--zone-green)' :
                s.total_earned >= 0 ? 'var(--color-text)' : 'var(--zone-red)';
        return `
      <div class="projector-row" style="animation-delay: ${i * 0.05}s">
        <span class="projector-rank">${rankDisplay}</span>
        <span class="projector-name">${escHtml(s.name)}</span>
        <span class="projector-points" style="color: ${color}">${s.total_earned} pts</span>
      </div>`;
    }).join('');
}

// ── Admin Console ──
async function showAdmin() {
    showScreen('admin');
    try {
        const stats = await getAdminStats();
        $('#stat-students').textContent = stats.students;
        $('#stat-points').textContent = stats.points;
        $('#stat-redemptions').textContent = stats.redemptions;

        const users = await listUsers();
        $('#stat-users').textContent = users.length;
        renderUserList(users);
    } catch (err) {
        toast('Failed to load admin data: ' + err.message, 'error');
    }
}

function renderUserList(users) {
    const container = $('#user-list');
    if (!users.length) {
        container.innerHTML = `<div class="empty-state"><p class="empty-state-text">No users found.</p></div>`;
        return;
    }

    container.innerHTML = users.map((u) => `
    <div class="user-row">
      <div class="user-info">
        <span class="user-email">${escHtml(u.email)}</span>
        <span class="user-role">${u.user_metadata?.role || 'teacher'}</span>
      </div>
      <span style="font-size: 0.8rem; color: var(--color-text-muted)">
        Created ${new Date(u.created_at).toLocaleDateString()}
      </span>
    </div>
  `).join('');
}

// ── Modals ──
function showModal(title, bodyHtml) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHtml;
    modalOverlay.hidden = false;
}

function closeModal() {
    modalOverlay.hidden = true;
}

function showAddStudentModal() {
    showModal('Add Student', `
    <form id="add-student-form">
      <div class="form-group">
        <label for="student-name-input">Student Name</label>
        <input type="text" id="student-name-input" placeholder="e.g. Alex" required autofocus>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Student</button>
      </div>
    </form>
  `);

    $('#add-student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#student-name-input').value.trim();
        if (!name) return;
        try {
            await addStudent(name);
            toast(`${name} added!`, 'success');
            closeModal();
            await refreshAll();
        } catch (err) {
            toast('Error: ' + err.message, 'error');
        }
    });
}

function showAddRewardModal() {
    showModal('Add Reward', `
    <form id="add-reward-form">
      <div class="form-group">
        <label for="reward-name-input">Reward Name</label>
        <input type="text" id="reward-name-input" placeholder="e.g. Sticker Pack" required autofocus>
      </div>
      <div class="form-group">
        <label for="reward-cost-input">Point Cost</label>
        <input type="number" id="reward-cost-input" min="1" placeholder="e.g. 10" required>
      </div>
      <div class="form-group">
        <label for="reward-stock-input">Stock (leave blank = unlimited)</label>
        <input type="number" id="reward-stock-input" min="0" placeholder="e.g. 5">
      </div>
      <div class="form-group">
        <label for="reward-emoji-input">Emoji Icon</label>
        <input type="text" id="reward-emoji-input" placeholder="e.g. 🧸" maxlength="4">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Reward</button>
      </div>
    </form>
  `);

    $('#add-reward-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#reward-name-input').value.trim();
        const cost = parseInt($('#reward-cost-input').value);
        const stock = $('#reward-stock-input').value ? parseInt($('#reward-stock-input').value) : null;
        const image_url = $('#reward-emoji-input').value.trim() || null;
        if (!name || !cost) return;
        try {
            await addReward({ name, cost, stock, image_url });
            toast(`${name} added to shop!`, 'success');
            closeModal();
            rewards = await getRewards();
            renderShop();
        } catch (err) {
            toast('Error: ' + err.message, 'error');
        }
    });
}

function showCategoryModal(studentId, studentName) {
    const categoryBtns = CATEGORIES.map((cat) =>
        `<button class="btn btn-secondary btn-sm" onclick="app.awardWithCategory('${studentId}', '${cat}')">${cat}</button>`
    ).join('');

    showModal(`Award Points — ${studentName}`, `
    <p style="margin-bottom: 1rem; color: var(--color-text-muted)">Choose a category:</p>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
      ${categoryBtns}
    </div>
  `);
}

function showRedeemModal(studentId, studentName, balance) {
    if (!rewards.length) {
        toast('No rewards in the shop yet!', 'info');
        return;
    }

    const rewardBtns = rewards.map((r) => {
        const canAfford = balance >= r.cost;
        const outOfStock = r.stock !== null && r.stock <= 0;
        const disabled = !canAfford || outOfStock;
        const label = outOfStock ? 'Out of stock' : !canAfford ? 'Not enough pts' : `🪙 ${r.cost}`;
        return `
      <button class="btn ${disabled ? 'btn-secondary' : 'btn-success'} btn-sm"
        ${disabled ? 'disabled' : ''}
        onclick="app.redeem('${studentId}', '${r.id}', ${r.cost}, '${escAttr(r.name)}')">
        ${r.image_url || '🎁'} ${escHtml(r.name)} — ${label}
      </button>`;
    }).join('');

    showModal(`Redeem Reward — ${studentName} (💰 ${balance} pts)`, `
    <p style="margin-bottom: 1rem; color: var(--color-text-muted)">Choose a reward:</p>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      ${rewardBtns}
    </div>
  `);
}

function showInviteUserModal() {
    showModal('Invite New User', `
    <form id="invite-user-form">
      <div class="form-group">
        <label for="invite-email">Email</label>
        <input type="email" id="invite-email" placeholder="teacher@school.com" required autofocus>
      </div>
      <div class="form-group">
        <label for="invite-password">Initial Password</label>
        <input type="text" id="invite-password" placeholder="temp-password-123" required>
      </div>
      <div class="form-group">
        <label for="invite-role">Role</label>
        <select id="invite-role">
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Send Invite</button>
      </div>
    </form>
  `);

    $('#invite-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#invite-email').value.trim();
        const password = $('#invite-password').value;
        const role = $('#invite-role').value;
        try {
            await inviteUser(email, role, password);
            toast(`Invited ${email} as ${role}!`, 'success');
            closeModal();
            showAdmin(); // refresh user list
        } catch (err) {
            toast('Error: ' + err.message, 'error');
        }
    });
}

// ── Actions (exposed globally for inline handlers) ──
async function quickPoint(studentId, amount) {
    try {
        await awardPoints(studentId, amount);
        await refreshAll();
        if (amount > 0) {
            toast(`+${amount} point${amount > 1 ? 's' : ''}!`, 'success');
        } else {
            toast(`${amount} point${amount < -1 ? 's' : ''}`, 'info');
        }
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function awardWithCategory(studentId, category) {
    try {
        await awardPoints(studentId, 1, category);
        closeModal();
        await refreshAll();
        toast(`+1 for ${category}!`, 'success');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function handleDeleteStudent(id, name) {
    if (!confirm(`Remove ${name} from the class? This will delete all their points.`)) return;
    try {
        await deleteStudent(id);
        toast(`${name} removed`, 'info');
        await refreshAll();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function handleDeleteReward(id) {
    if (!confirm('Remove this reward from the shop?')) return;
    try {
        await deleteReward(id);
        toast('Reward removed', 'info');
        rewards = await getRewards();
        renderShop();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function handleRedeem(studentId, rewardId, cost, rewardName) {
    try {
        await redeemReward(studentId, rewardId, cost);
        closeModal();
        toast(`🎉 Redeemed ${rewardName}!`, 'success');
        await refreshAll();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function handleResetPoints() {
    if (!confirm('Reset ALL student points to zero? This cannot be undone.')) return;
    try {
        await resetAllPoints();
        toast('All points reset to zero', 'info');
        await refreshAll();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function handleExportCSV() {
    try {
        const data = await getStudents();
        const csvRows = [
            ['Name', 'Total Earned', 'Total Spent', 'Balance'].join(','),
            ...data.map((s) =>
                [s.name, s.total_earned, s.total_spent, s.balance].join(',')
            ),
        ];
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `classroom-score-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast('CSV downloaded!', 'success');
    } catch (err) {
        toast('Error exporting: ' + err.message, 'error');
    }
}

// ── Toast Notifications ──
function toast(message, type = 'info') {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ── Utility ──
function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── Expose API for inline handlers ──
window.app = {
    quickPoint,
    awardWithCategory,
    deleteStudent: handleDeleteStudent,
    deleteReward: handleDeleteReward,
    redeem: handleRedeem,
    showCategoryModal,
    showRedeemModal,
    closeModal,
};

// ── Boot ──
init();
