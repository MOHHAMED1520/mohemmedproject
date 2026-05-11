/* ==============================================
   نظام إدارة المهام الجامعية
   محمد عبدالله الفتيني - الإصدار 2.0
   app.js - الملف الرئيسي للتطبيق
   ============================================== */

'use strict';

// ===== Default Tasks =====
const defaultTasks = [
  {
    id: 1,
    title: 'تسليم مشروع تطوير الويب',
    description: 'رفع النسخة النهائية للمشروع مع فحص الواجهة الأمامية وتجهيز العرض النهائي للدكتور.',
    category: 'مشروع',
    priority: 'عالية',
    dueDate: '2026-05-20',
    progress: 85,
    status: 'قيد التنفيذ',
    subject: 'تطوير الويب',
    notes: 'مراجعة CSS قبل التسليم',
    createdAt: Date.now() - 3 * 86400000
  },
  {
    id: 2,
    title: 'مراجعة اختبار قواعد البيانات',
    description: 'حل أسئلة السنوات السابقة ومراجعة أوامر SQL الأساسية والمتقدمة.',
    category: 'اختبار',
    priority: 'حرجة',
    dueDate: '2026-05-14',
    progress: 100,
    status: 'مكتملة',
    subject: 'قواعد البيانات',
    notes: 'راجع JOIN و Subqueries',
    createdAt: Date.now() - 7 * 86400000
  },
  {
    id: 3,
    title: 'إنهاء واجب هندسة البرمجيات',
    description: 'كتابة تحليل المتطلبات وحالات الاستخدام UML للمشروع الدراسي.',
    category: 'واجب',
    priority: 'عالية',
    dueDate: '2026-05-18',
    progress: 40,
    status: 'قيد التنفيذ',
    subject: 'هندسة البرمجيات',
    notes: '',
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: 4,
    title: 'قراءة فصول الشبكات',
    description: 'قراءة الفصول من 5 إلى 8 في كتاب Computer Networks.',
    category: 'مذاكرة',
    priority: 'متوسطة',
    dueDate: '2026-05-22',
    progress: 60,
    status: 'قيد التنفيذ',
    subject: 'الشبكات الحاسوبية',
    notes: 'التركيز على TCP/IP',
    createdAt: Date.now() - 86400000
  },
  {
    id: 5,
    title: 'تقرير الأمن السيبراني',
    description: 'كتابة تقرير شامل عن أحدث تهديدات الأمن السيبراني وطرق التصدي لها.',
    category: 'تقرير',
    priority: 'متوسطة',
    dueDate: '2026-05-28',
    progress: 20,
    status: 'قيد التنفيذ',
    subject: 'الأمن السيبراني',
    notes: 'لا تنسَ المراجع',
    createdAt: Date.now() - 5 * 86400000
  }
];

// ===== App State =====
const STORAGE_KEY = 'utms-v2-tasks';
let tasks = [];
let currentFilter = 'الكل';
let editingId = null;
let confirmCallback = null;
let chartsInitialized = false;
let statusChartInstance = null;
let priorityChartInstance = null;
let categoryChartInstance = null;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initParticles();
  initTheme();
  loadTasks();
  renderTasks();
  renderStats();
  initCharts();
  initScrollBehavior();
  initFilterButtons();
  setupForm();
  initWeeklyCount();
  checkOverdueTasks();
  setTodayAsMinDate();
});

// ===== Loader =====
function initLoader() {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 2000);
}

// ===== Particles =====
function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;
  const count = window.innerWidth < 768 ? 15 : 35;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;
    container.appendChild(p);
  }
}

// ===== Theme =====
function initTheme() {
  const saved = localStorage.getItem('utms-theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = 'fa-solid fa-sun';
  }
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
}
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('utms-theme', isLight ? 'light' : 'dark');
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  updateChartsTheme();
}

// ===== Load / Save Tasks =====
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [...defaultTasks];
  } catch {
    tasks = [...defaultTasks];
  }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== Date Helpers =====
function setTodayAsMinDate() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('dueDate');
  if (dateInput) dateInput.min = today;
}
function isLate(task) {
  if (!task.dueDate || task.status === 'مكتملة') return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = Math.ceil((target - today) / 86400000);
  return diff;
}

// ===== Priority Sorting =====
const priorityOrder = { 'حرجة': 0, 'عالية': 1, 'متوسطة': 2, 'منخفضة': 3 };

// ===== Render Tasks =====
function renderTasks() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;

  const searchVal = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const sortVal = document.getElementById('sortSelect')?.value || 'date';

  let filtered = [...tasks];

  // Filter by status
  if (currentFilter === 'مكتملة') {
    filtered = filtered.filter(t => t.status === 'مكتملة');
  } else if (currentFilter === 'قيد التنفيذ') {
    filtered = filtered.filter(t => t.status === 'قيد التنفيذ');
  } else if (currentFilter === 'متأخرة') {
    filtered = filtered.filter(t => isLate(t));
  }

  // Search
  if (searchVal) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(searchVal) ||
      (t.description || '').toLowerCase().includes(searchVal) ||
      (t.subject || '').toLowerCase().includes(searchVal) ||
      t.category.toLowerCase().includes(searchVal)
    );
  }

  // Sort
  if (sortVal === 'date') {
    filtered.sort((a, b) => new Date(a.dueDate || '2100-01-01') - new Date(b.dueDate || '2100-01-01'));
  } else if (sortVal === 'priority') {
    filtered.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
  } else if (sortVal === 'progress') {
    filtered.sort((a, b) => b.progress - a.progress);
  } else if (sortVal === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
  }

  // Count label
  const countLabel = document.getElementById('taskCountLabel');
  if (countLabel) {
    countLabel.textContent = filtered.length === 0
      ? 'لا توجد مهام مطابقة'
      : `عرض ${filtered.length} من ${tasks.length} مهمة`;
  }

  if (!filtered.length) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-clipboard-list"></i>
        <p>${searchVal ? 'لا توجد نتائج للبحث عن "' + searchVal + '"' : 'لا توجد مهام في هذا التصنيف. ابدأ بإضافة مهمة!'}</p>
      </div>`;
    renderStats();
    return;
  }

  taskList.innerHTML = filtered.map(task => buildTaskCard(task)).join('');
  renderStats();
  updateCharts();
}

// ===== Build Task Card =====
function buildTaskCard(task) {
  const late = isLate(task);
  const completed = task.status === 'مكتملة';
  const days = daysUntil(task.dueDate);
  let dateLabel = '';
  if (task.dueDate) {
    if (completed) {
      dateLabel = `<span class="tag tag-date"><i class="fa-solid fa-calendar-check"></i> ${formatDate(task.dueDate)}</span>`;
    } else if (late) {
      const overdue = Math.abs(days);
      dateLabel = `<span class="tag tag-late"><i class="fa-solid fa-clock"></i> متأخرة بـ ${overdue} يوم</span>`;
    } else if (days === 0) {
      dateLabel = `<span class="tag tag-late"><i class="fa-solid fa-bell"></i> اليوم هو آخر موعد!</span>`;
    } else if (days <= 3) {
      dateLabel = `<span class="tag tag-late"><i class="fa-solid fa-hourglass-half"></i> ${days} أيام متبقية</span>`;
    } else {
      dateLabel = `<span class="tag tag-date"><i class="fa-solid fa-calendar"></i> ${formatDate(task.dueDate)}</span>`;
    }
  }

  const subjectTag = task.subject
    ? `<span class="tag tag-subject"><i class="fa-solid fa-book"></i> ${escapeHtml(task.subject)}</span>`
    : '';

  const notesHtml = task.notes
    ? `<div style="font-size:.82rem;color:var(--muted);margin:6px 0;display:flex;align-items:center;gap:6px;">
         <i class="fa-solid fa-note-sticky" style="color:var(--orange)"></i>
         ${escapeHtml(task.notes)}
       </div>`
    : '';

  return `
    <article class="task-card priority-${escapeHtml(task.priority)} ${completed ? 'completed-card' : ''} ${late ? 'late-card' : ''}">
      <div class="task-top">
        <h3>${completed ? `<del style="opacity:.6">${escapeHtml(task.title)}</del>` : escapeHtml(task.title)}</h3>
        <span class="tag ${completed ? 'status-completed' : 'status-progress'}">
          <i class="fa-solid ${completed ? 'fa-circle-check' : 'fa-spinner'}"></i>
          ${task.status}
        </span>
      </div>
      ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
      ${notesHtml}
      <div class="task-meta">
        <span class="tag category"><i class="fa-solid fa-tag"></i> ${escapeHtml(task.category)}</span>
        <span class="tag priority-${escapeHtml(task.priority)}">
          <i class="fa-solid fa-flag"></i> ${escapeHtml(task.priority)}
        </span>
        ${subjectTag}
        ${dateLabel}
      </div>
      <div class="progress-bar">
        <span style="width:${task.progress}%"></span>
      </div>
      <div class="task-actions">
        <span class="progress-text">
          <i class="fa-solid fa-chart-line" style="color:var(--primary)"></i>
          التقدّم: <strong>${task.progress}%</strong>
        </span>
        <div class="task-actions-left">
          <button class="action-btn edit-btn" onclick="startEdit(${task.id})">
            <i class="fa-solid fa-pen-to-square"></i> تعديل
          </button>
          <button class="action-btn complete-btn" onclick="toggleTask(${task.id})">
            <i class="fa-solid ${completed ? 'fa-rotate-right' : 'fa-check'}"></i>
            ${completed ? 'إعادة فتح' : 'إنهاء'}
          </button>
          <button class="action-btn danger" onclick="confirmDelete(${task.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

// ===== Render Stats =====
function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'مكتملة').length;
  const inProgress = tasks.filter(t => t.status === 'قيد التنفيذ').length;
  const late = tasks.filter(t => isLate(t)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  setText('totalTasks', total);
  setText('completedTasks', completed);
  setText('inProgressTasks', inProgress);
  setText('lateTasks', late);
  setText('totalInline', total);
  setText('completedInline', completed);
  setText('progressInline', pct + '%');
  setText('overallPct', pct + '%');

  const fill = document.getElementById('overallFill');
  if (fill) fill.style.width = pct + '%';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== Weekly Count =====
function initWeeklyCount() {
  const oneWeekAgo = Date.now() - 7 * 86400000;
  const count = tasks.filter(t => (t.createdAt || 0) >= oneWeekAgo).length;
  setText('weeklyCount', `+${count} مهمة`);
}

// ===== Check Overdue =====
function checkOverdueTasks() {
  const lateCount = tasks.filter(t => isLate(t)).length;
  if (lateCount > 0) {
    setTimeout(() => showToast(`⚠️ لديك ${lateCount} مهمة متأخرة!`, true), 2500);
  }
}

// ===== Form Setup =====
function setupForm() {
  const form = document.getElementById('taskForm');
  if (!form) return;
  form.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  if (!title) { showToast('يرجى إدخال عنوان المهمة', true); return; }

  const taskData = {
    title,
    description: document.getElementById('description').value.trim(),
    category: document.getElementById('category').value,
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('dueDate').value,
    progress: Number(document.getElementById('progress').value),
    subject: document.getElementById('subject')?.value.trim() || '',
    notes: document.getElementById('notes')?.value.trim() || '',
  };

  if (editingId !== null) {
    tasks = tasks.map(t => t.id === editingId
      ? { ...t, ...taskData, status: taskData.progress >= 100 ? 'مكتملة' : 'قيد التنفيذ' }
      : t
    );
    showToast('✅ تم تحديث المهمة بنجاح');
    cancelEditMode();
  } else {
    const newTask = {
      id: Date.now(),
      ...taskData,
      status: taskData.progress >= 100 ? 'مكتملة' : 'قيد التنفيذ',
      createdAt: Date.now()
    };
    tasks.unshift(newTask);
    showToast('✅ تمت إضافة المهمة بنجاح');
  }

  saveTasks();
  renderTasks();
  initWeeklyCount();
  document.getElementById('taskForm').reset();
  document.getElementById('progress').value = 25;
  document.getElementById('progressLabel').textContent = '25%';
}

// ===== Edit / Delete / Toggle =====
window.startEdit = function (id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;

  document.getElementById('editId').value = id;
  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description || '';
  document.getElementById('category').value = task.category;
  document.getElementById('priority').value = task.priority;
  document.getElementById('dueDate').value = task.dueDate || '';
  document.getElementById('progress').value = task.progress;
  document.getElementById('progressLabel').textContent = task.progress + '%';
  if (document.getElementById('subject')) document.getElementById('subject').value = task.subject || '';
  if (document.getElementById('notes')) document.getElementById('notes').value = task.notes || '';

  document.getElementById('formTitle').textContent = 'تعديل المهمة';
  document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';
  document.getElementById('cancelEdit').style.display = 'flex';

  document.getElementById('formPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function cancelEditMode() {
  editingId = null;
  document.getElementById('editId').value = '';
  document.getElementById('taskForm').reset();
  document.getElementById('progress').value = 25;
  document.getElementById('progressLabel').textContent = '25%';
  document.getElementById('formTitle').textContent = 'إضافة مهمة جديدة';
  document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ المهمة';
  document.getElementById('cancelEdit').style.display = 'none';
}
window.cancelEditMode = cancelEditMode;

window.toggleTask = function (id) {
  tasks = tasks.map(t => t.id === id
    ? {
      ...t,
      status: t.status === 'مكتملة' ? 'قيد التنفيذ' : 'مكتملة',
      progress: t.status === 'مكتملة' ? 70 : 100
    }
    : t
  );
  saveTasks();
  renderTasks();
  showToast('✅ تم تحديث حالة المهمة');
};

window.confirmDelete = function (id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  showConfirm(
    'حذف المهمة',
    `هل تريد حذف مهمة "${task.title}" نهائياً؟`,
    () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
      showToast('🗑️ تم حذف المهمة');
    }
  );
};

// ===== Clear All =====
window.clearAllTasks = function () {
  if (!tasks.length) { showToast('لا توجد مهام لحذفها', true); return; }
  showConfirm(
    'حذف جميع المهام',
    'هل تريد حذف جميع المهام نهائياً؟ لا يمكن التراجع عن هذه العملية.',
    () => {
      tasks = [];
      saveTasks();
      renderTasks();
      showToast('🗑️ تم حذف جميع المهام');
    }
  );
};

// ===== Filter Buttons =====
function initFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });
}

// ===== Scroll Behavior =====
function initScrollBehavior() {
  const topbar = document.getElementById('topbar');
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 30);
    if (backToTop) backToTop.classList.toggle('hidden', window.scrollY < 300);
  });
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
window.scrollToSection = scrollToSection;

// ===== Mobile Nav =====
document.getElementById('burger')?.addEventListener('click', () => {
  document.getElementById('mobileNav')?.classList.toggle('open');
});
window.closeMobileNav = function () {
  document.getElementById('mobileNav')?.classList.remove('open');
};

// ===== Toast =====
let toastTimer = null;
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.remove('hidden', 'error-toast');
  if (isError) toast.classList.add('error-toast');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ===== Confirm Modal =====
function showConfirm(title, msg, onYes) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmModal').classList.remove('hidden');
  confirmCallback = onYes;
}
window.closeConfirm = function () {
  document.getElementById('confirmModal').classList.add('hidden');
  confirmCallback = null;
};
document.getElementById('confirmYes')?.addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  window.closeConfirm();
});

// ===== Export / Import =====
window.exportJSON = function () {
  if (!tasks.length) { showToast('لا توجد مهام للتصدير', true); return; }
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  downloadFile(blob, 'university-tasks.json');
  showToast('✅ تم تصدير المهام بصيغة JSON');
};
window.exportCSV = function () {
  if (!tasks.length) { showToast('لا توجد مهام للتصدير', true); return; }
  const headers = ['العنوان', 'الوصف', 'التصنيف', 'الأولوية', 'المادة', 'تاريخ التسليم', 'التقدّم', 'الحالة', 'الملاحظات'];
  const rows = tasks.map(t => [
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.category, t.priority, t.subject || '',
    t.dueDate || '', t.progress + '%', t.status,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);
  const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, 'university-tasks.csv');
  showToast('✅ تم تصدير المهام بصيغة CSV');
};
window.importTasks = function () {
  document.getElementById('importFile')?.click();
};
window.handleImport = function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (Array.isArray(imported)) {
        tasks = [...imported, ...tasks];
        saveTasks();
        renderTasks();
        showToast(`✅ تم استيراد ${imported.length} مهمة`);
      } else {
        showToast('صيغة الملف غير صحيحة', true);
      }
    } catch {
      showToast('خطأ في قراءة الملف', true);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
};

function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// ===== Charts =====
function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;
  updateCharts();
}

function updateCharts() {
  const textColor = document.body.classList.contains('light-mode') ? '#2a3f6a' : '#c8d9f5';
  const gridColor = document.body.classList.contains('light-mode') ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)';

  const completed = tasks.filter(t => t.status === 'مكتملة').length;
  const inProgress = tasks.filter(t => t.status === 'قيد التنفيذ').length;
  const late = tasks.filter(t => isLate(t)).length;

  // Status Chart
  const statusCtx = document.getElementById('statusChart')?.getContext('2d');
  if (statusCtx) {
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['مكتملة', 'قيد التنفيذ', 'متأخرة'],
        datasets: [{
          data: [completed, inProgress, late],
          backgroundColor: ['#25c18d', '#4f8cff', '#ff6467'],
          borderWidth: 0, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: textColor, font: { family: 'Cairo', size: 13 }, padding: 16 } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} مهمة` } }
        },
        cutout: '65%'
      }
    });
  }

  // Priority Chart
  const priorityCtx = document.getElementById('priorityChart')?.getContext('2d');
  if (priorityCtx) {
    const pData = ['حرجة', 'عالية', 'متوسطة', 'منخفضة'].map(p => tasks.filter(t => t.priority === p).length);
    if (priorityChartInstance) priorityChartInstance.destroy();
    priorityChartInstance = new Chart(priorityCtx, {
      type: 'bar',
      data: {
        labels: ['🚨 حرجة', '🔴 عالية', '🟡 متوسطة', '🟢 منخفضة'],
        datasets: [{
          label: 'عدد المهام',
          data: pData,
          backgroundColor: ['rgba(232,121,249,.7)', 'rgba(255,100,103,.7)', 'rgba(255,176,32,.7)', 'rgba(37,193,141,.7)'],
          borderRadius: 8, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Cairo' }, stepSize: 1 }, beginAtZero: true },
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Cairo', size: 12 } } }
        }
      }
    });
  }

  // Category Chart
  const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
  if (categoryCtx) {
    const categories = ['واجب', 'مشروع', 'اختبار', 'مذاكرة', 'تقرير', 'عرض'];
    const cData = categories.map(c => tasks.filter(t => t.category === c).length);
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(categoryCtx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'عدد المهام',
          data: cData,
          backgroundColor: 'rgba(79,140,255,.6)',
          hoverBackgroundColor: 'rgba(102,209,255,.8)',
          borderRadius: 10, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Cairo' }, stepSize: 1 }, beginAtZero: true },
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Cairo', size: 13 } } }
        }
      }
    });
  }
}
function updateChartsTheme() { updateCharts(); }

// ===== Escape HTML =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==============================================
   AI CHATBOT ENGINE
   مساعد ذكاء اصطناعي لنظام إدارة المهام
   ============================================== */

let chatOpen = false;
const chatKnowledge = buildChatKnowledge();

function buildChatKnowledge() {
  return [
    // Greetings
    {
      patterns: ['مرحبا', 'هلا', 'السلام', 'هي', 'أهلاً', 'اهلا', 'صباح', 'مساء', 'كيف حالك', 'كيفك'],
      response: () => `أهلاً وسهلاً! 👋 أنا المساعد الذكي لـ **نظام إدارة المهام الجامعية**.\n\n📊 إحصائياتك الحالية:\n• إجمالي المهام: **${tasks.length}**\n• المكتملة: **${tasks.filter(t=>t.status==='مكتملة').length}**\n• قيد التنفيذ: **${tasks.filter(t=>t.status==='قيد التنفيذ').length}**\n\nكيف يمكنني مساعدتك اليوم؟ 😊`
    },
    // Task count / stats
    {
      patterns: ['كم عدد', 'إحصائيات', 'احصائيات', 'إجمالي', 'عدد المهام', 'كم مهمة', 'الإحصائيات', 'ما هي إحصائياتي'],
      response: () => {
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'مكتملة').length;
        const prog = tasks.filter(t => t.status === 'قيد التنفيذ').length;
        const late = tasks.filter(t => isLate(t)).length;
        const pct = total ? Math.round((done/total)*100) : 0;
        return `📊 **إحصائياتك الحالية:**\n\n✅ المهام المكتملة: **${done}**\n🔄 قيد التنفيذ: **${prog}**\n⚠️ المتأخرة: **${late}**\n📈 نسبة الإنجاز: **${pct}%**\n\n${pct >= 80 ? '🎉 رائع! أنت على المسار الصحيح!' : pct >= 50 ? '💪 نصف الطريق وصلت، واصل!' : '🎯 ابدأ بالمهام العاجلة أولاً!'}`;
      }
    },
    // Add task
    {
      patterns: ['كيف أضيف', 'إضافة مهمة', 'اضافة مهمة', 'أنشئ مهمة', 'مهمة جديدة', 'إضافة واجب'],
      response: () => `➕ **كيفية إضافة مهمة جديدة:**\n\n1️⃣ اذهب إلى قسم **"إدارة المهام"** في الصفحة\n2️⃣ أدخل **عنوان المهمة** (إلزامي)\n3️⃣ أضف **وصف** اختياري للتفاصيل\n4️⃣ اختر **التصنيف** (واجب، مشروع، اختبار...)\n5️⃣ حدد **الأولوية** والتاريخ\n6️⃣ حرّك شريط **نسبة التقدّم**\n7️⃣ اضغط **"حفظ المهمة"** 💾\n\nتجدها فوراً في القائمة!`
    },
    // Late tasks
    {
      patterns: ['متأخرة', 'المتأخرة', 'overdue', 'فات وقتها', 'تأخرت'],
      response: () => {
        const late = tasks.filter(t => isLate(t));
        if (!late.length) return '✅ **لا توجد مهام متأخرة!** أنت منظم جداً، رائع! 🎉';
        const list = late.slice(0, 3).map(t => `• **${t.title}** — كان موعدها ${formatDate(t.dueDate)}`).join('\n');
        return `⚠️ **لديك ${late.length} مهمة متأخرة:**\n\n${list}${late.length > 3 ? `\n... و${late.length - 3} أخرى` : ''}\n\n🚀 نصيحة: ابدأ بأقصرها وأيسرها لتكسب زخماً!`;
      }
    },
    // Export
    {
      patterns: ['تصدير', 'export', 'حفظ نسخة', 'استيراد', 'import', 'json', 'csv'],
      response: () => `📤 **تصدير واستيراد المهام:**\n\n**التصدير:**\n• اضغط "JSON" لتصدير بيانات كاملة قابلة للاستيراد\n• اضغط "CSV" لفتحها في Excel أو Sheets\n\n**الاستيراد:**\n• اضغط "استيراد" واختر ملف JSON محفوظ مسبقاً\n\nستجد هذه الأزرار أسفل نموذج الإضافة في قسم **"تصدير المهام"** 📂`
    },
    // Priorities
    {
      patterns: ['أولوية', 'الأولوية', 'ترتيب', 'ما هي الأولوية', 'أولوياتي'],
      response: () => {
        const critical = tasks.filter(t => t.priority === 'حرجة' && t.status !== 'مكتملة').length;
        const high = tasks.filter(t => t.priority === 'عالية' && t.status !== 'مكتملة').length;
        return `🚦 **توزيع الأولويات (غير المكتملة):**\n\n🚨 حرجة: **${critical}**\n🔴 عالية: **${high}**\n🟡 متوسطة: **${tasks.filter(t=>t.priority==='متوسطة'&&t.status!=='مكتملة').length}**\n🟢 منخفضة: **${tasks.filter(t=>t.priority==='منخفضة'&&t.status!=='مكتملة').length}**\n\n💡 نصيحة: ابدأ دائماً بالمهام الحرجة والعالية الأولوية!`;
      }
    },
    // Tips / Productivity
    {
      patterns: ['نصيحة', 'نصائح', 'نصائح للدراسة', 'كيف أنظم', 'إنتاجية', 'تنظيم', 'تعلم'],
      response: () => {
        const tips = [
          '🎯 قسّم المهام الكبيرة إلى مهام أصغر وأكثر تحقيقاً.',
          '🕐 استخدم تقنية Pomodoro: 25 دقيقة عمل + 5 دقائق راحة.',
          '📅 ابدأ أصعب مهمة في الصباح حين تكون طاقتك في أوجها.',
          '✅ أنهِ المهام الصغيرة أولاً لتكسب زخماً إيجابياً.',
          '🔔 حدّد مواعيد نهائية مبكّرة بيوم أو يومين للأمان.',
          '📵 اعزل مصادر التشتيت خلال جلسات الدراسة المركزة.',
          '🌟 احتفل بإنجاز كل مهمة — الدماغ يحب المكافآت!'
        ];
        const tip = tips[Math.floor(Math.random() * tips.length)];
        return `💡 **نصيحة اليوم:**\n\n${tip}\n\n📚 هل تريد المزيد من النصائح؟ فقط اسأل!`;
      }
    },
    // Search task
    {
      patterns: ['ابحث', 'بحث', 'هل لدي', 'هل عندي', 'أجد مهمة'],
      response: () => `🔍 **كيفية البحث عن مهمة:**\n\nاستخدم **خانة البحث** الموجودة في أعلى قائمة المهام.\n\nيمكنك البحث بـ:\n• عنوان المهمة\n• اسم المادة الدراسية\n• الوصف\n• التصنيف\n\nكما يمكنك استخدام **أزرار الفلترة** للتصفية حسب الحالة (الكل / قيد التنفيذ / مكتملة / متأخرة)`
    },
    // Dark / Light mode
    {
      patterns: ['وضع', 'داكن', 'فاتح', 'مظهر', 'ثيم', 'لون'],
      response: () => `🎨 **تغيير المظهر:**\n\nاضغط على أيقونة **القمر 🌙** في شريط التنقل العلوي للتبديل بين:\n• 🌙 الوضع الداكن (الافتراضي)\n• ☀️ الوضع الفاتح\n\nيتم حفظ اختيارك تلقائياً!`
    },
    // Charts / Analytics
    {
      patterns: ['رسم', 'تحليل', 'إحصاء', 'chart', 'بياني', 'تحليلات'],
      response: () => `📊 **التحليلات البيانية:**\n\nيوفر النظام **3 رسوم بيانية تفاعلية:**\n\n1️⃣ **توزيع الحالة** (دائري): مكتملة / قيد التنفيذ / متأخرة\n2️⃣ **توزيع الأولوية** (أعمدة): حرجة / عالية / متوسطة / منخفضة\n3️⃣ **توزيع التصنيف** (أعمدة): واجب / مشروع / اختبار / مذاكرة...\n\nاذهب إلى قسم **"التحليلات"** في الصفحة لرؤيتها 📈`
    },
    // Delete
    {
      patterns: ['حذف', 'مسح', 'إزالة', 'ازالة'],
      response: () => `🗑️ **حذف المهام:**\n\n**حذف مهمة واحدة:**\n• اضغط على زر **🗑 الحذف** داخل بطاقة المهمة\n• ستظهر نافذة تأكيد قبل الحذف النهائي\n\n**حذف جميع المهام:**\n• اضغط على **زر القمامة الأحمر** بجانب أزرار التصفية\n\n⚠️ تحذير: الحذف نهائي ولا يمكن التراجع عنه.`
    },
    // Complete task
    {
      patterns: ['أنهيت', 'اكتملت', 'أنهيت مهمة', 'علّم كمكتمل', 'انتهيت'],
      response: () => `✅ **تعليم المهمة كمكتملة:**\n\n1️⃣ اعثر على المهمة في القائمة\n2️⃣ اضغط زر **"إنهاء"** ✔️\n3️⃣ سيتغير لونها وحالتها إلى "مكتملة"\n4️⃣ يمكنك إعادة فتحها بالضغط **"إعادة فتح"**\n\n🎉 رائع، واصل الإنجاز!`
    },
    // Who created
    {
      patterns: ['من صنع', 'من طوّر', 'من أنشأ', 'صاحب', 'المطور', 'من انشأ', 'اصنع من'],
      response: () => `👨‍💻 **عن المطوّر:**\n\nهذا النظام من إنشاء وإعداد:\n\n🌟 **محمد عبدالله الفتيني**\n\nتم بناؤه بأحدث تقنيات تطوير الويب:\n• HTML5 + CSS3 + JavaScript\n• Chart.js للرسوم البيانية\n• تصميم RTL عربي كامل\n• مساعد ذكاء اصطناعي مدمج\n\n💡 الإصدار 2.0 — 2025`
    },
    // How to use
    {
      patterns: ['كيف أستخدم', 'شرح النظام', 'دليل', 'tutorial', 'تعليمات', 'كيف يعمل'],
      response: () => `📖 **دليل استخدام النظام:**\n\n**الأقسام الرئيسية:**\n🎯 **لوحة التحكم** — إحصائيات سريعة\n📊 **التحليلات** — رسوم بيانية تفاعلية\n➕ **إضافة مهمة** — نموذج الإدخال\n📋 **قائمة المهام** — مع بحث وفلترة\n\n**الإجراءات الأساسية:**\n• إضافة ✅ تعديل ✏️ حذف 🗑️ إنهاء ✔️\n• بحث 🔍 فلترة 🔖 تصدير 📤\n\nهل تريد تفاصيل عن قسم معين؟`
    },
    // Upcoming / deadline
    {
      patterns: ['قريبة', 'مواعيد', 'هذا الأسبوع', 'اليوم', 'غداً', 'deadline', 'التسليم'],
      response: () => {
        const upcoming = tasks
          .filter(t => t.status !== 'مكتملة' && t.dueDate)
          .filter(t => { const d = daysUntil(t.dueDate); return d !== null && d >= 0 && d <= 7; })
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        if (!upcoming.length) return '📅 **لا توجد مهام قريبة الموعد خلال الأسبوع القادم!** يبدو أنك تملك وقتاً كافياً 😊';
        const list = upcoming.slice(0, 5).map(t => {
          const d = daysUntil(t.dueDate);
          const label = d === 0 ? '🔴 اليوم' : d === 1 ? '🟠 غداً' : `🟡 بعد ${d} أيام`;
          return `• **${t.title}** — ${label}`;
        }).join('\n');
        return `⏰ **المهام القريبة الموعد (7 أيام):**\n\n${list}\n\n💪 هيا، لا تدع الوقت يفوت!`;
      }
    },
    // Default fallback
    {
      patterns: [],
      response: (msg) => {
        const responses = [
          `🤔 لم أفهم سؤالك تماماً. يمكنني مساعدتك في:\n\n• إضافة وإدارة المهام\n• معرفة إحصائياتك\n• نصائح الإنتاجية\n• كيفية استخدام الميزات\n\nحاول أن تسألني بشكل أوضح 😊`,
          `💬 سؤالك "${msg.length > 30 ? msg.slice(0, 30) + '...' : msg}" يحتاج توضيحاً أكثر.\n\nجرّب أن تسألني عن:\n• **إحصائياتك** 📊\n• **مهامك المتأخرة** ⚠️\n• **كيفية إضافة مهمة** ➕\n• **نصائح للدراسة** 💡`,
          `🎯 يمكنني مساعدتك في كل ما يتعلق بنظام إدارة المهام. اسألني مثلاً:\n\n"ما هي مهامي المتأخرة؟"\n"كيف أضيف مهمة جديدة؟"\n"أعطني نصيحة للدراسة"`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  ];
}

function matchChatIntent(input) {
  const normalized = input.trim().toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي');

  for (const item of chatKnowledge) {
    if (item.patterns.length === 0) continue;
    if (item.patterns.some(p => normalized.includes(p.replace(/[أإآ]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[ى]/g, 'ي')))) {
      return item.response;
    }
  }
  // fallback
  return chatKnowledge[chatKnowledge.length - 1].response;
}

// ===== Chatbot UI =====
window.toggleChatbot = function () {
  chatOpen = !chatOpen;
  const win = document.getElementById('chatbotWindow');
  const icon = document.getElementById('chatbotIcon');
  const badge = document.getElementById('chatbotBadge');

  if (chatOpen) {
    win.classList.remove('hidden');
    if (icon) { icon.className = 'fa-solid fa-xmark'; }
    if (badge) badge.classList.add('hidden');
    setTimeout(() => {
      const msgs = document.getElementById('chatMessages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }, 100);
  } else {
    win.classList.add('hidden');
    if (icon) icon.className = 'fa-solid fa-robot';
  }
};

window.quickReply = function (text) {
  const input = document.getElementById('chatInput');
  if (input) { input.value = text; }
  sendMessage();
  document.getElementById('quickReplies')?.remove();
};

window.sendMessage = function () {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  appendMsg(text, 'user');
  input.value = '';
  input.style.height = 'auto';

  // Show typing indicator
  const typingId = showTyping();

  setTimeout(() => {
    removeTyping(typingId);
    const handler = matchChatIntent(text);
    const response = handler(text);
    appendMsg(response, 'bot');
    scrollChatToBottom();
  }, 800 + Math.random() * 700);
};

function appendMsg(text, role) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = role === 'bot'
    ? '<i class="fa-solid fa-robot"></i>'
    : '<i class="fa-solid fa-user"></i>';

  const content = document.createElement('div');
  content.className = 'msg-content';
  content.innerHTML = formatBotMessage(text);

  div.appendChild(avatar);
  div.appendChild(content);
  container.appendChild(div);
  scrollChatToBottom();
}

function formatBotMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

let typingCounter = 0;
function showTyping() {
  const id = 'typing-' + (++typingCounter);
  const container = document.getElementById('chatMessages');
  if (!container) return id;
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing-indicator';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-content">
      <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>`;
  container.appendChild(div);
  scrollChatToBottom();
  return id;
}
function removeTyping(id) {
  document.getElementById(id)?.remove();
}
function scrollChatToBottom() {
  const msgs = document.getElementById('chatMessages');
  if (msgs) setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
}

window.clearChat = function () {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  container.innerHTML = `
    <div class="chat-msg bot">
      <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="msg-content">
        <p>تم مسح المحادثة 🧹 كيف يمكنني مساعدتك؟</p>
      </div>
    </div>`;
};

window.handleChatKey = function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};
window.autoResizeTextarea = function (el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
};

// Close chatbot on outside click
document.addEventListener('click', (e) => {
  const container = document.getElementById('chatbotContainer');
  if (chatOpen && container && !container.contains(e.target)) {
    // don't auto-close, let user close manually
  }
});
