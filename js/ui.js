const UI = {
  // Navegación de pestañas
  showSection(sectionId) {
    document.querySelectorAll('.section-area').forEach(s => s.classList.replace('show-section', 'hide-section'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.replace('hide-section', 'show-section');
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
        link.classList.add('active');
      }
    });
  },

  // Alertas profesionales
  showAlert(message, type = 'success') {
    Swal.fire({
      icon: type === 'danger' ? 'error' : type,
      title: type === 'danger' ? 'Error' : 'Operación Exitosa',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true
    });
  },

  // Estado de botones "Cargando"
  setLoading(buttonElement, isLoading) {
    if (isLoading) {
      buttonElement.disabled = true;
      buttonElement.dataset.originalText = buttonElement.innerHTML;
      buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
    } else {
      buttonElement.disabled = false;
      buttonElement.innerHTML = buttonElement.dataset.originalText;
    }
  }
};

// Escuchador del Sticky Header al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
  const topbar = document.getElementById('main-topbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      topbar.classList.add('scrolled');
    } else {
      topbar.classList.remove('scrolled');
    }
  }, { passive: true });
});