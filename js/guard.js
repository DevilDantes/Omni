console.log("🛡️ Guardián: Verificando acceso...");

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('omnisynch_token');
  const userStr = localStorage.getItem('omnisynch_user');

  console.log("🔑 Token encontrado:", token);

  const currentPage = window.location.pathname.split('/').pop();

  // 🚫 Si no hay token y no estamos en login → redirigir
  if (!token && currentPage !== 'login.html') {
    console.warn("🚫 No hay token. Redirigiendo al login...");
    window.location.href = 'login.html';
    return;
  }

  // ✅ Si hay usuario, pintar datos
  if (userStr) {
    const usuarioActual = JSON.parse(userStr);
    const nombreUI = document.getElementById('user-name-display');
    const rolUI = document.getElementById('user-role-display');
    const avatarUI = document.getElementById('user-avatar');

    if (nombreUI) nombreUI.textContent = usuarioActual.nombre;
    if (rolUI) rolUI.textContent = (usuarioActual.rol || 'USUARIO').toUpperCase();
    if (avatarUI) {
      avatarUI.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioActual.nombre)}&background=0d6efd&color=fff`;
    }
  }
});

function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'login.html';
}