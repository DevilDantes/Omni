document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  const alertBox = document.getElementById('login-alert');
  
  // Estado de carga
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verificando...';
  alertBox.classList.add('d-none'); // Ocultar alerta previa

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', { // <--- Agregamos http://localhost:3000
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
    });

    const data = await response.json();

    if (response.ok) {
    localStorage.setItem('omnisynch_token', data.token);
    localStorage.setItem('omnisynch_user', JSON.stringify(data.usuario));

    console.log("✅ Token guardado:", data.token); // 👈 DEBUG

    window.location.href = 'panel.html'; 
    } else {
      // ❌ Mostrar error en la interfaz
      alertBox.textContent = data.error || 'Error al iniciar sesión';
      alertBox.classList.remove('d-none');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = 'Ingresar al Sistema <i class="bi bi-box-arrow-in-right ms-2"></i>';
    }
  } catch (error) {
    console.error("Error:", error);
    alertBox.textContent = 'Error de conexión con el servidor. Revisa que Node.js esté corriendo.';
    alertBox.classList.remove('d-none');
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = 'Ingresar al Sistema <i class="bi bi-box-arrow-in-right ms-2"></i>';
  }
});