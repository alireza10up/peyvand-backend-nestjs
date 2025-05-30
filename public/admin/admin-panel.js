function showSection(section) {
  document.querySelectorAll('.panel-section').forEach(s => s.style.display = 'none');
  document.getElementById(section).style.display = 'block';
  loadSection(section);
}

async function loadSection(section) {
  switch(section) {
    case 'overview': await loadOverview(); break;
    case 'users': await loadUsers(); break;
    case 'posts': await loadPosts(); break;
    case 'comments': await loadComments(); break;
    case 'settings': await loadSettings(); break;
  }
}

async function loadOverview() {
  const res = await fetch('/admin/overview');
  const data = await res.json();
  document.getElementById('overview').innerHTML = `
    <h2>Overview</h2>
    <ul>
      <li>Total Users: ${data.usersCount}</li>
      <li>Total Posts: ${data.postsCount}</li>
      <li>Total Comments: ${data.commentsCount}</li>
    </ul>
  `;
}

async function loadUsers() {
  const res = await fetch('/admin/users');
  const users = await res.json();
  let html = `<h2>Users</h2><table><tr><th>ID</th><th>Email</th><th>Admin</th><th>Actions</th></tr>`;
  users.forEach(u => {
    html += `<tr><td>${u.id}</td><td>${u.email}</td><td>${u.isAdmin ? 'Yes' : 'No'}</td><td>
      <button class='action-btn admin' onclick='toggleAdmin(${u.id},${!u.isAdmin})'>${u.isAdmin ? 'Revoke' : 'Make'} Admin</button>
      <button class='action-btn edit' onclick='showChangePassword(${u.id})'>Change Password</button>
      <button class='action-btn delete' onclick='deleteUser(${u.id})'>Delete</button>
    </td></tr>`;
  });
  html += `</table><div id='change-password-modal' style='display:none'></div>`;
  document.getElementById('users').innerHTML = html;
}

async function toggleAdmin(userId, isAdmin) {
  await fetch(`/admin/users/${userId}/admin`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({isAdmin})});
  loadUsers();
}

function showChangePassword(userId) {
  const modal = document.getElementById('change-password-modal');
  modal.style.display = 'block';
  modal.innerHTML = `<div style='background:#fff;padding:20px;border:1px solid #ccc;'><h3>Change Password</h3>
    <input type='password' id='new-password' placeholder='New Password' />
    <button onclick='changePassword(${userId})'>Change</button>
    <button onclick='closeChangePassword()'>Cancel</button></div>`;
}

function closeChangePassword() {
  document.getElementById('change-password-modal').style.display = 'none';
}

async function changePassword(userId) {
  const newPassword = document.getElementById('new-password').value;
  await fetch(`/admin/users/${userId}/password`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({newPassword})});
  closeChangePassword();
}

async function deleteUser(userId) {
  if(confirm('Delete user?')) {
    await fetch(`/admin/users/${userId}`, {method:'DELETE'});
    loadUsers();
  }
}

async function loadPosts() {
  const res = await fetch('/admin/posts');
  const posts = await res.json();
  let html = `<h2>Posts</h2><table><tr><th>ID</th><th>Title</th><th>User</th><th>Actions</th></tr>`;
  posts.forEach(p => {
    html += `<tr><td>${p.id}</td><td>${p.title || ''}</td><td>${p.user?.email || ''}</td><td>
      <button class='action-btn delete' onclick='deletePost(${p.id})'>Delete</button>
    </td></tr>`;
  });
  html += `</table>`;
  document.getElementById('posts').innerHTML = html;
}

async function deletePost(postId) {
  if(confirm('Delete post?')) {
    await fetch(`/admin/posts/${postId}`, {method:'DELETE'});
    loadPosts();
  }
}

async function loadComments() {
  const res = await fetch('/admin/comments');
  const comments = await res.json();
  let html = `<h2>Comments</h2><table><tr><th>ID</th><th>Content</th><th>User</th><th>Post</th><th>Actions</th></tr>`;
  comments.forEach(c => {
    html += `<tr><td>${c.id}</td><td>${c.content}</td><td>${c.user?.email || ''}</td><td>${c.post?.id || ''}</td><td>
      <button class='action-btn delete' onclick='deleteComment(${c.id})'>Delete</button>
    </td></tr>`;
  });
  html += `</table>`;
  document.getElementById('comments').innerHTML = html;
}

async function deleteComment(commentId) {
  if(confirm('Delete comment?')) {
    await fetch(`/admin/comments/${commentId}`, {method:'DELETE'});
    loadComments();
  }
}

async function loadSettings() {
  const res = await fetch('/admin/settings');
  const settings = await res.json();
  let html = `<h2>Settings</h2><pre>${JSON.stringify(settings, null, 2)}</pre>`;
  document.getElementById('settings').innerHTML = html;
}

window.onload = () => showSection('overview');
