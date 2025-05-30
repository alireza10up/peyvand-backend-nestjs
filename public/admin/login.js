document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');
  const API_BASE_URL = '';

  if (localStorage.getItem('adminToken')) {
    window.location.href = 'index.html';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signIn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ایمیل یا رمز عبور اشتباه است.');
      }

      // Check if user is admin (assuming isAdmin flag is in profile)
      const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${data.token || data.accessToken}` },
      });
      const userData = await profileResponse.json();

      if (!userData.isAdmin) {
        throw new Error('شما دسترسی ادمین ندارید.');
      }

      localStorage.setItem('adminToken', data.token || data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(userData));
      window.location.href = 'index.html';
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  });
});
