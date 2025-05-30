class Section {
  constructor(id) {
    this.id = id;
    this.el = document.getElementById(id);
  }
  async show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }
}

// Helper for fetch with token and error handling
async function fetchWithAuth(url, options = {}) {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const res = await fetch(url, options);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res;
  } catch (error) {
    console.error('API Error:', error);
    showError(error.message);
    throw error;
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

class OverviewSection extends Section {
  constructor() { super('overview'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/overview');
      const data = await res.json();
      this.el.innerHTML = `
        <h2>داشبورد</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <i class="fas fa-users"></i>
            <h3>کاربران</h3>
            <p>${data.usersCount}</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-file-alt"></i>
            <h3>پست‌ها</h3>
            <p>${data.postsCount}</p>
          </div>
          <div class="stat-card">
            <i class="fas fa-comments"></i>
            <h3>نظرات</h3>
            <p>${data.commentsCount}</p>
          </div>
        </div>
      `;
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری اطلاعات</div>`;
    }
  }
}

class UsersSection extends Section {
  constructor() { super('users'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/users');
      const users = await res.json();
      let html = `
        <h2>مدیریت کاربران</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>شناسه</th>
                <th>ایمیل</th>
                <th>ادمین</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      users.forEach(u => {
        html += `
          <tr>
            <td>${u.id}</td>
            <td>${u.email}</td>
            <td>${u.isAdmin ? 'بله' : 'خیر'}</td>
            <td>
              <button class="action-btn admin" data-user-id="${u.id}" data-is-admin="${u.isAdmin}">
                ${u.isAdmin ? 'لغو ادمین' : 'اعطای ادمین'}
              </button>
              <button class="action-btn edit" data-user-id="${u.id}">تغییر رمز</button>
              <button class="action-btn delete" data-user-id="${u.id}">حذف</button>
            </td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
        <div id="change-password-modal" class="modal" style="display:none">
          <div class="modal-content">
            <h3>تغییر رمز عبور</h3>
            <input type="password" id="new-password" placeholder="رمز جدید" />
            <div class="modal-actions">
              <button class="action-btn edit" id="confirm-password">تغییر</button>
              <button class="action-btn delete" id="cancel-password">انصراف</button>
            </div>
          </div>
        </div>
      `;
      
      this.el.innerHTML = html;
      this.attachEventListeners();
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری کاربران</div>`;
    }
  }

  attachEventListeners() {
    // Admin toggle
    this.el.querySelectorAll('.action-btn.admin').forEach(btn => {
      btn.onclick = async () => {
        const userId = btn.dataset.userId;
        const isAdmin = btn.dataset.isAdmin === 'true';
        try {
          await fetchWithAuth(`/admin/users/${userId}/admin`, {
            method: 'PATCH',
            body: JSON.stringify({ isAdmin: !isAdmin })
          });
          showSuccess('وضعیت ادمین با موفقیت تغییر کرد');
          this.show();
        } catch (error) {
          showError('خطا در تغییر وضعیت ادمین');
        }
      };
    });

    // Change password
    this.el.querySelectorAll('.action-btn.edit').forEach(btn => {
      if (!btn.id) { // Only for the edit buttons in the table
        btn.onclick = () => {
          const userId = btn.dataset.userId;
          const modal = document.getElementById('change-password-modal');
          modal.style.display = 'block';
          modal.dataset.userId = userId;
        };
      }
    });

    // Password modal actions
    document.getElementById('confirm-password').onclick = async () => {
      const modal = document.getElementById('change-password-modal');
      const userId = modal.dataset.userId;
      const newPassword = document.getElementById('new-password').value;
      
      if (!newPassword) {
        showError('لطفا رمز جدید را وارد کنید');
        return;
      }

      try {
        await fetchWithAuth(`/admin/users/${userId}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ newPassword })
        });
        showSuccess('رمز عبور با موفقیت تغییر کرد');
        modal.style.display = 'none';
        document.getElementById('new-password').value = '';
      } catch (error) {
        showError('خطا در تغییر رمز عبور');
      }
    };

    document.getElementById('cancel-password').onclick = () => {
      const modal = document.getElementById('change-password-modal');
      modal.style.display = 'none';
      document.getElementById('new-password').value = '';
    };

    // Delete user
    this.el.querySelectorAll('.action-btn.delete').forEach(btn => {
      if (!btn.id) { // Only for the delete buttons in the table
        btn.onclick = async () => {
          const userId = btn.dataset.userId;
          if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
            try {
              await this.deleteUser(userId);
            } catch (error) {
              showError('خطا در حذف کاربر');
            }
          }
        };
      }
    });
  }

  async deleteUser(userId) {
    try {
      const response = await fetchWithAuth(`/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('خطا در حذف کاربر');
      }

      showSuccess('کاربر و تمام اطلاعات مرتبط با موفقیت حذف شد');
      this.show(); // Refresh the users list
    } catch (error) {
      showError(error.message);
    }
  }
}

class PostsSection extends Section {
  constructor() { super('posts'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/posts');
      const posts = await res.json();
      let html = `
        <h2>مدیریت پست‌ها</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>شناسه</th>
                <th>عنوان</th>
                <th>کاربر</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      posts.forEach(p => {
        html += `
          <tr>
            <td>${p.id}</td>
            <td>${p.title || ''}</td>
            <td>${p.user?.email || ''}</td>
            <td>
              <button class="action-btn delete" data-post-id="${p.id}">حذف</button>
            </td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      this.el.innerHTML = html;
      this.attachEventListeners();
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری پست‌ها</div>`;
    }
  }

  attachEventListeners() {
    this.el.querySelectorAll('.action-btn.delete').forEach(btn => {
      btn.onclick = async () => {
        const postId = btn.dataset.postId;
        if (confirm('آیا از حذف این پست اطمینان دارید؟')) {
          try {
            await fetchWithAuth(`/admin/posts/${postId}`, { method: 'DELETE' });
            showSuccess('پست با موفقیت حذف شد');
            this.show();
          } catch (error) {
            showError('خطا در حذف پست');
          }
        }
      };
    });
  }
}

class CommentsSection extends Section {
  constructor() { super('comments'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/comments');
      const comments = await res.json();
      let html = `
        <h2>مدیریت نظرات</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>شناسه</th>
                <th>متن</th>
                <th>کاربر</th>
                <th>پست</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      comments.forEach(c => {
        html += `
          <tr>
            <td>${c.id}</td>
            <td>${c.content}</td>
            <td>${c.user?.email || ''}</td>
            <td>${c.post?.id || ''}</td>
            <td>
              <button class="action-btn delete" data-comment-id="${c.id}">حذف</button>
            </td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      this.el.innerHTML = html;
      this.attachEventListeners();
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری نظرات</div>`;
    }
  }

  attachEventListeners() {
    this.el.querySelectorAll('.action-btn.delete').forEach(btn => {
      btn.onclick = async () => {
        const commentId = btn.dataset.commentId;
        if (confirm('آیا از حذف این نظر اطمینان دارید؟')) {
          try {
            await fetchWithAuth(`/admin/comments/${commentId}`, { method: 'DELETE' });
            showSuccess('نظر با موفقیت حذف شد');
            this.show();
          } catch (error) {
            showError('خطا در حذف نظر');
          }
        }
      };
    });
  }
}

class SettingsSection extends Section {
  constructor() { super('settings'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/settings');
      const settings = await res.json();
      let html = `
        <h2>تنظیمات سیستم</h2>
        <div class="settings-container">
          <div class="setting-item">
            <label>
              <input type="checkbox" id="comments-enabled" ${settings.commentsEnabled ? 'checked' : ''}>
              فعال‌سازی نظرات
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="registration-enabled" ${settings.registrationEnabled ? 'checked' : ''}>
              فعال‌سازی ثبت‌نام
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="post-creation-enabled" ${settings.postCreationEnabled ? 'checked' : ''}>
              فعال‌سازی ایجاد پست
            </label>
          </div>
          <button class="action-btn edit" id="save-settings">ذخیره تنظیمات</button>
        </div>
      `;
      
      this.el.innerHTML = html;
      this.attachEventListeners();
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری تنظیمات</div>`;
    }
  }

  attachEventListeners() {
    document.getElementById('save-settings').onclick = async () => {
      const settings = {
        commentsEnabled: document.getElementById('comments-enabled').checked,
        registrationEnabled: document.getElementById('registration-enabled').checked,
        postCreationEnabled: document.getElementById('post-creation-enabled').checked
      };

      try {
        await fetchWithAuth('/admin/settings', {
          method: 'PATCH',
          body: JSON.stringify(settings)
        });
        showSuccess('تنظیمات با موفقیت ذخیره شد');
      } catch (error) {
        showError('خطا در ذخیره تنظیمات');
      }
    };
  }
}

class SystemSection extends Section {
  constructor() { super('system'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/system-info');
      const info = await res.json();
      
      // Format memory values
      const formatMemory = (bytes) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(2)} GB`;
      };

      // Format uptime
      const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days} روز و ${hours} ساعت و ${minutes} دقیقه`;
      };

      let html = `
        <h2>اطلاعات سیستم</h2>
        <div class="info-grid">
          <div class="info-item">
            <h4>سیستم عامل</h4>
            <p>${info.platform} ${info.release}</p>
          </div>
          <div class="info-item">
            <h4>معماری</h4>
            <p>${info.arch}</p>
          </div>
          <div class="info-item">
            <h4>پردازنده‌ها</h4>
            <p>${info.cpus} هسته</p>
          </div>
          <div class="info-item">
            <h4>حافظه کل</h4>
            <p>${formatMemory(info.totalmem)}</p>
          </div>
          <div class="info-item">
            <h4>حافظه آزاد</h4>
            <p>${formatMemory(info.freemem)}</p>
          </div>
          <div class="info-item">
            <h4>زمان کارکرد</h4>
            <p>${formatUptime(info.uptime)}</p>
          </div>
          <div class="info-item">
            <h4>نام میزبان</h4>
            <p>${info.hostname}</p>
          </div>
          <div class="info-item">
            <h4>کاربر</h4>
            <p>${info.userInfo.username}</p>
          </div>
        </div>
      `;
      
      this.el.innerHTML = html;
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری اطلاعات سیستم</div>`;
    }
  }
}

class EnvSection extends Section {
  constructor() { super('env'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/env');
      const env = await res.json();
      
      let html = `
        <h2>متغیرهای محیطی</h2>
        <div class="info-grid">
      `;
      
      // Add each environment variable as an info item
      Object.entries(env).forEach(([key, value]) => {
        html += `
          <div class="info-item">
            <h4>${key}</h4>
            <p>${value}</p>
          </div>
        `;
      });
      
      html += `
        </div>
      `;
      
      this.el.innerHTML = html;
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری متغیرهای محیطی</div>`;
    }
  }
}

class LogsSection extends Section {
  constructor() { super('logs'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/logs');
      const logs = await res.json();
      let html = `
        <h2>لاگ‌های سیستم</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>زمان</th>
                <th>سطح</th>
                <th>پیام</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      logs.forEach(log => {
        html += `
          <tr class="log-level-${log.level}">
            <td>${new Date(log.timestamp).toLocaleString('fa-IR')}</td>
            <td>${log.level}</td>
            <td>${log.message}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      this.el.innerHTML = html;
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری لاگ‌ها</div>`;
    }
  }
}

class RestartSection extends Section {
  constructor() { super('restart'); }
  async show() {
    this.el.innerHTML = `
      <h2>ریستارت سرور</h2>
      <div class="restart-container">
        <p>با کلیک روی دکمه زیر، سرور ریستارت خواهد شد.</p>
        <button class="action-btn delete" id="restart-btn">ریستارت سرور</button>
        <div id="restart-status"></div>
      </div>
    `;
    
    document.getElementById('restart-btn').onclick = async () => {
      if (confirm('آیا از ریستارت سرور اطمینان دارید؟')) {
        try {
          const res = await fetchWithAuth('/admin/restart', { method: 'POST' });
          const data = await res.json();
          showSuccess(data.message || 'سرور با موفقیت ریستارت شد');
        } catch (error) {
          showError('خطا در ریستارت سرور');
        }
      }
    };
    
    super.show();
  }
}

class RelationshipsSection extends Section {
  constructor() { super('relationships'); }
  async show() {
    try {
      const res = await fetchWithAuth('/admin/relationships');
      const responseData = await res.json();
      
      let html = `
        <h2>شبکه روابط</h2>
        <div class="relationships-container">
          <div class="network-graph" id="networkGraph"></div>
        </div>
      `;
      
      this.el.innerHTML = html;
      
      // Initialize the network graph using vis.js
      const container = document.getElementById('networkGraph');
      const nodes = new vis.DataSet(responseData.nodes);
      const edges = new vis.DataSet(responseData.edges);
      
      const networkData = {
        nodes: nodes,
        edges: edges
      };
      
      const options = {
        nodes: {
          shape: 'dot',
          size: 16,
          font: {
            size: 12,
            face: 'Vazirmatn'
          },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          width: 1,
          arrows: {
            to: { enabled: true, scaleFactor: 1 }
          },
          font: {
            size: 10,
            face: 'Vazirmatn',
            align: 'middle',
            strokeWidth: 0
          },
          smooth: {
            type: 'continuous',
            forceDirection: 'none'
          }
        },
        physics: {
          stabilization: {
            iterations: 100,
            updateInterval: 25,
            onlyDynamicEdges: false,
            fit: true
          },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 200,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.1
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true
        },
        groups: {
          users: {
            color: { background: 'var(--primary-color)', border: 'var(--primary-dark)' }
          },
          posts: {
            color: { background: 'var(--success-color)', border: '#15803d' }
          },
          comments: {
            color: { background: 'var(--warning-color)', border: '#a16207' }
          },
          messages: {
            color: { background: 'var(--danger-color)', border: '#b91c1c' }
          },
          conversations: {
            color: { background: '#7c3aed', border: '#6d28d9' }
          }
        }
      };
      
      const network = new vis.Network(container, networkData, options);
      
      // Add event listeners
      network.on('click', function(params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.get(nodeId);
          console.log('Clicked node:', node);
        }
      });
      
      network.on('stabilizationProgress', function(params) {
        // Show loading progress
        const progress = Math.round(params.iterations / params.total * 100);
        if (progress < 100) {
          showSuccess(`در حال بارگذاری شبکه: ${progress}%`);
        }
      });
      
      network.on('stabilizationIterationsDone', function() {
        showSuccess('شبکه روابط با موفقیت بارگذاری شد');
      });
      
      super.show();
    } catch (error) {
      this.el.innerHTML = `<div class="error">خطا در بارگذاری شبکه روابط</div>`;
    }
  }
}

class AdminPanel {
  constructor() {
    this.sections = {
      overview: new OverviewSection(),
      users: new UsersSection(),
      posts: new PostsSection(),
      comments: new CommentsSection(),
      settings: new SettingsSection(),
      system: new SystemSection(),
      env: new EnvSection(),
      logs: new LogsSection(),
      restart: new RestartSection(),
      relationships: new RelationshipsSection()
    };
  }

  async showSection(section) {
    Object.values(this.sections).forEach(s => s.hide());
    await this.sections[section].show();
  }
}

// Initialize admin panel
window.addEventListener('DOMContentLoaded', () => {
  const adminPanel = new AdminPanel();
  window.adminPanel = adminPanel;

  // Sidebar navigation
  document.querySelector('.sidebar-menu').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li && li.dataset.section) {
      document.querySelectorAll('.sidebar-menu li').forEach(item => 
        item.classList.remove('active')
      );
      li.classList.add('active');
      adminPanel.showSection(li.dataset.section);
    }
  });

  // Set default active section
  const defaultSection = document.querySelector('.sidebar-menu li[data-section="overview"]');
  defaultSection.classList.add('active');
  adminPanel.showSection('overview');
});
