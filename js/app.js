// 🛡️ GUARDIÁN DE SEGURIDAD: Verifica si hay sesión activa antes de cargar la página
(function() {
  const token = localStorage.getItem('omnisynch_token');
  if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
})();

const App = {
  init: () => {
    App.actualizarInterfazUsuario(); 

    App.setupEventListeners();
    App.cargarDashboard();
    App.cargarProductos();
    App.cargarInventario();
    App.cargarAlertas();
    App.cargarProveedores();
    App.cargarCategorias(); 
    App.cargarMarcas(); 
    App.cargarVentas(); 
    App.cargarReportes(); 
    App.cargarUsuarios(); // 💡 Llama a la tabla de usuarios
    
    App.chequearEstadoReal();
    setInterval(App.chequearEstadoReal, 15000);
    
    setInterval(App.cargarAlertas, 15000); 
  },

  actualizarInterfazUsuario: () => {
    const userStr = localStorage.getItem('omnisynch_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      const nameUI = document.getElementById('user-nav-name');
      const roleUI = document.getElementById('user-nav-role');
      const avatarUI = document.getElementById('user-nav-avatar');

      if (nameUI) nameUI.textContent = user.nombre;
      if (roleUI) roleUI.textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);
      
      if (avatarUI) {
        avatarUI.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=0f172a&color=fff&rounded=true&bold=true`;
      }

      const inputNombre = document.getElementById('perfil_nombre');
      if (inputNombre) inputNombre.value = user.nombre;

      // 🛡️ Restricciones para el Empleado (Operador/Vendedor)
      if (user.rol !== 'admin') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => el.classList.add('d-none'));
      }
    }
  },

  logout: () => {
    localStorage.removeItem('omnisynch_token');
    localStorage.removeItem('omnisynch_user');
    window.location.href = 'login.html';
  },

  setupEventListeners: () => {
    // 👤 EVENTO: Guardar cambios del Modal "Mi Perfil"
    const formPerfil = document.getElementById('form-perfil-usuario');
    if (formPerfil) {
      formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('omnisynch_user'));
        const nuevoNombre = document.getElementById('perfil_nombre').value;
        const nuevaPass = document.getElementById('perfil_pass').value;

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Guardando...';
        btn.disabled = true;

        try {
          const res = await fetch('http://localhost:3000/api/usuarios/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              correo: user.correo, 
              nombre: nuevoNombre, 
              password: nuevaPass 
            })
          });

          if (res.ok) {
            user.nombre = nuevoNombre;
            localStorage.setItem('omnisynch_user', JSON.stringify(user));
            
            App.actualizarInterfazUsuario();
            
            const modalEl = document.getElementById('modalPerfil');
            const modalInst = bootstrap.Modal.getInstance(modalEl);
            if(modalInst) modalInst.hide();

            document.getElementById('perfil_pass').value = '';
            
            if(window.Swal) {
              Swal.fire('¡Éxito!', 'Perfil actualizado correctamente', 'success');
            } else {
              alert("¡Perfil actualizado con éxito!");
            }
          } else {
            const errorData = await res.json();
            if(window.Swal) Swal.fire('Error', errorData.error || "Error al actualizar", 'error');
            else alert(errorData.error || "Error al actualizar");
          }
        } catch (error) {
          console.error("Error al actualizar perfil", error);
          if(window.Swal) Swal.fire('Error', 'Error de conexión al servidor', 'error');
          else alert("Error de conexión al servidor");
        } finally {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      });
    }

    // 🛡️ EVENTO: Crear Nuevo Usuario (Admin)
    const formUsuario = document.getElementById('form-nuevo-usuario');
    if (formUsuario) {
      formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = 'Creando...';

        const payload = {
          nombre: document.getElementById('usr_nombre').value,
          correo: document.getElementById('usr_correo').value,
          password: document.getElementById('usr_pass').value,
          rol: document.getElementById('usr_rol').value
        };

        try {
          await API.post('usuarios', payload);
          if(window.Swal) Swal.fire('¡Éxito!', 'Usuario creado exitosamente', 'success');
          else alert('Usuario creado exitosamente');
          formUsuario.reset();
          App.cargarUsuarios(); 
        } catch (error) {
          if(window.Swal) Swal.fire('Error', error.message || 'No se pudo crear el usuario', 'error');
          else alert('Error: ' + (error.message || 'No se pudo crear el usuario'));
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-person-plus me-1"></i>Crear Usuario';
        }
      });
    }

    // --- CÓDIGO ORIGINAL INTACTO ---
    const selectTipo = document.getElementById('prod_tipo');
    const panelVariantes = document.getElementById('panel-variantes');

    if (selectTipo && panelVariantes) {
      selectTipo.addEventListener('change', (e) => {
        if (e.target.value.toLowerCase() === 'variable') {
          panelVariantes.classList.remove('d-none');
        } else {
          panelVariantes.classList.add('d-none');
        }
      });
    }

    const formProducto = document.getElementById('form-producto');
    if (formProducto) {
      formProducto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        UI.setLoading(btn, true);
        
        const payload = {
          nombre: document.getElementById('prod_nombre').value,
          id_categoria: document.getElementById('prod_categoria').value || null,
          id_marca: document.getElementById('prod_marca').value || null,
          id_proveedor: document.getElementById('prod_proveedor').value || null,
          precio_compra: document.getElementById('prod_compra').value,
          precio_venta: document.getElementById('prod_venta').value,
          tipo: document.getElementById('prod_tipo').value, 
          descripcion: document.getElementById('prod_desc').value,
          
          talla: document.getElementById('var_talla')?.value || 'N/A',
          color: document.getElementById('var_color')?.value || 'N/A',
          material: document.getElementById('var_material')?.value || '',
          presentacion: document.getElementById('var_presentacion')?.value || '',
          codigo_barras: document.getElementById('var_codigo_barras')?.value || '',
          stock_minimo: document.getElementById('var_stock_minimo')?.value || 5
        };

        try {
          await API.post('productos', payload); 
          UI.showAlert('Producto registrado en la base de datos.', 'success');
          formProducto.reset();
          if (panelVariantes) panelVariantes.classList.add('d-none');
          App.cargarProductos(); 
          App.cargarDashboard(); 
        } catch (error) {
          UI.showAlert(error.message ? 'Error: ' + error.message : 'Error al guardar el producto.', 'danger');
        } finally {
          UI.setLoading(btn, false);
        }
      });
    }

    const formEntrada = document.getElementById('form-entrada');
    if (formEntrada) {
      formEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        UI.setLoading(btn, true);
        
        const payload = {
          id_variante: document.getElementById('entrada_variante').value,
          cantidad: document.getElementById('entrada_cantidad').value,
          tipo_movimiento: 'entrada',
          id_almacen: 1, id_inventario: 1, id_producto: 1 
        };

        try {
          await API.post('inventario', payload); 
          UI.showAlert('Entrada de stock registrada exitosamente.', 'success');
          formEntrada.reset();
          App.cargarInventario(); 
          App.cargarAlertas(); 
          App.cargarReportes(); 
        } catch (error) {
          UI.showAlert(error.message ? 'Error: ' + error.message : 'Error al registrar la entrada.', 'danger');
        } finally {
          UI.setLoading(btn, false);
        }
      });
    }

    const formSalida = document.getElementById('form-salida');
    if (formSalida) {
      formSalida.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        UI.setLoading(btn, true);
        
        const payload = {
          id_variante: document.getElementById('salida_variante').value,
          cantidad: document.getElementById('salida_cantidad').value,
          tipo_movimiento: 'salida',
          id_almacen: 1, id_inventario: 1, id_producto: 1 
        };

        try {
          await API.post('inventario', payload); 
          UI.showAlert('Salida de stock registrada exitosamente.', 'success');
          formSalida.reset();
          App.cargarInventario();
          App.cargarAlertas();
          App.cargarReportes(); 
        } catch (error) {
          UI.showAlert(error.message ? 'Error: ' + error.message : 'Error al registrar la salida.', 'danger');
        } finally {
          UI.setLoading(btn, false);
        }
      });
    }

    const formProveedor = document.getElementById('form-proveedor');
    if (formProveedor) {
      formProveedor.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        UI.setLoading(btn, true);
        
        const payload = {
          nombre: document.getElementById('prov_nombre').value,
          correo: document.getElementById('prov_correo').value,
          telefono: document.getElementById('prov_telefono').value,
          ciudad: document.getElementById('prov_ciudad').value,
          empresa: document.getElementById('prov_empresa').value
        };

        try {
          await API.post('proveedores', payload); 
          UI.showAlert('Proveedor registrado exitosamente.', 'success');
          formProveedor.reset();
          App.cargarProveedores(); 
        } catch (error) {
          UI.showAlert(error.message ? 'Error: ' + error.message : 'Error al guardar el proveedor.', 'danger');
        } finally {
          UI.setLoading(btn, false);
        }
      });
    }

    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
      formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        UI.setLoading(btn, true);
        
        const payload = {
          nombre: document.getElementById('cat_nombre').value,
          id_categoria_padre: document.getElementById('cat_padre').value || null,
          descripcion: document.getElementById('cat_desc').value
        };

        try {
          await API.post('categorias', payload); 
          UI.showAlert('Categoría registrada exitosamente.', 'success');
          formCategoria.reset();
          App.cargarCategorias(); 
        } catch (error) {
          UI.showAlert(error.message ? 'Error: ' + error.message : 'Error al guardar la categoría.', 'danger');
        } finally {
          UI.setLoading(btn, false);
        }
      });
    }

    const searchVenta = document.getElementById('venta_producto_search');
    const hiddenVariante = document.getElementById('venta_variante');
    
    if (searchVenta && hiddenVariante) {
      searchVenta.addEventListener('input', (e) => {
        const opciones = document.querySelectorAll('#lista-productos-venta option');
        let encontrado = false;
        opciones.forEach(opt => {
          if (opt.value === e.target.value) {
            hiddenVariante.value = opt.getAttribute('data-id');
            encontrado = true;
          }
        });
        if (!encontrado) hiddenVariante.value = ''; 
      });
    }

    const formVenta = document.getElementById('form-venta');
    if (formVenta) {
      formVenta.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        
        const payload = {
          codigo_orden: document.getElementById('venta_orden').value,
          id_variante: hiddenVariante.value,
          cantidad: document.getElementById('venta_cantidad').value,
          canal_venta: document.getElementById('venta_canal').value,
          metodo_pago: document.getElementById('venta_pago').value
        };

        if (!payload.id_variante) {
          UI.showAlert('Por favor, busca y selecciona un producto válido de la lista.', 'warning');
          return;
        }

        UI.setLoading(btn, true);

        try {
          await API.post('ventas', payload); 
          UI.showAlert('Venta procesada exitosamente.', 'success');
          formVenta.reset();
          hiddenVariante.value = ''; 
          
          App.cargarVentas(); 
          App.cargarInventario(); 
          App.cargarAlertas(); 
          App.cargarDashboard(); 
          App.cargarReportes(); 
        } catch (error) {
          UI.showAlert(error.message ? 'Error: ' + error.message : 'Error al registrar la venta.', 'danger');
        } finally {
          UI.setLoading(btn, false);
        }
      });
    }
  },
  
  chequearEstadoReal: () => {
    const statusText = document.getElementById('sys-status');
    const latencyText = document.getElementById('sys-latency');
    const progressBar = document.getElementById('sys-progress'); 

    if (!statusText || !latencyText) return;

    const tiempoInicio = performance.now();
    const img = new Image();

    img.onload = () => {
      const tiempoFin = performance.now();
      const latenciaMs = Math.round(tiempoFin - tiempoInicio);

      latencyText.textContent = `Latencia: ${latenciaMs} ms`;

      if (latenciaMs < 200) {
        statusText.textContent = 'Óptimo';
        if(progressBar) progressBar.className = 'progress-bar bg-success';
      } else if (latenciaMs < 500) {
        statusText.textContent = 'Estable';
        if(progressBar) progressBar.className = 'progress-bar bg-warning';
      } else {
        statusText.textContent = 'Lento';
        if(progressBar) progressBar.className = 'progress-bar bg-danger';
      }
    };

    img.onerror = () => {
      statusText.textContent = 'Desconectado';
      latencyText.textContent = 'Latencia: -- ms';
      if(progressBar) {
        progressBar.className = 'progress-bar bg-danger';
        progressBar.style.width = '100%';
      }
    };

    img.src = `https://www.google.com/favicon.ico?_=${new Date().getTime()}`;
  },

  cargarDashboard: async () => {
    try {
      const data = await API.get('dashboard');
      if (data && data.length > 0) {
        const stats = data[0];
        document.getElementById('stat-productos').innerText = stats.total_productos || 0;
        document.getElementById('stat-ventas').innerText = '$' + (stats.ventas_hoy || 0);
        const statProveedores = document.getElementById('stat-proveedores');
        if (statProveedores) {
          statProveedores.innerText = stats.total_proveedores || 0;
        }
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  },

  cargarProductos: async () => {
    const tbody = document.getElementById('tabla-productos-body'); 
    const targetBody = tbody ? tbody : document.getElementById('tabla-productos');
    
    if(!targetBody) return;
    targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando...</td></tr>';
    
    try {
      const productos = await API.get('productos');
      targetBody.innerHTML = '';

      if (productos.length === 0) {
        targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay productos.</td></tr>';
        return;
      }

      productos.forEach(prod => {
        let estadoBadge = prod.estado === 'activo' 
          ? '<span class="badge bg-success bg-opacity-10 text-success">Activo</span>'
          : '<span class="badge bg-secondary bg-opacity-10 text-secondary">Inactivo</span>';

        targetBody.innerHTML += `
          <tr>
            <td class="text-muted fw-bold">#${prod.id_producto}</td>
            <td class="fw-semibold">${prod.nombre}</td>
            <td>${prod.nombre_categoria || 'Sin categoría'}</td>
            <td>${prod.nombre_marca || 'Sin marca'}</td>
            <td>$${prod.precio_venta_base}</td>
            <td>${estadoBadge}</td>
          </tr>
        `;
      });
    } catch (error) {
      console.error("Error cargando productos:", error);
      targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar la tabla.</td></tr>';
    }
  },

  cargarInventario: async () => {
    const tbody = document.getElementById('tabla-inventario-body'); 
    const targetBody = tbody ? tbody : document.getElementById('tabla-inventario');
    const selectEntrada = document.getElementById('entrada_variante');
    const selectSalida = document.getElementById('salida_variante');
    const datalistVentas = document.getElementById('lista-productos-venta');
    
    if(!targetBody) return;
    targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando...</td></tr>';
    
    try {
      const inventario = await API.get('inventario');
      targetBody.innerHTML = '';

      if(selectEntrada) selectEntrada.innerHTML = '<option value="">Seleccionar producto...</option>';
      if(selectSalida) selectSalida.innerHTML = '<option value="">Seleccionar producto...</option>';
      if(datalistVentas) datalistVentas.innerHTML = ''; 

      if (inventario.length === 0) {
        targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay datos de inventario.</td></tr>';
        return;
      }

      inventario.forEach(inv => {
        let statusClass = inv.stock_actual <= inv.stock_minimo ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success';
        let statusText = inv.stock_actual <= inv.stock_minimo ? 'Crítico' : 'Óptimo';

        const idVariante = inv.id_variante || inv.id;
        const nombreProducto = inv.nombre || 'Producto Desconocido';

        targetBody.innerHTML += `
          <tr>
            <td class="text-muted fw-bold">#${idVariante}</td> <td class="fw-semibold">${nombreProducto} <small class="text-muted">(${inv.talla || ''} ${inv.color || ''})</small></td>
            <td>Bodega Principal</td> <td class="fw-bold fs-5">${inv.stock_actual}</td>
            <td>${inv.stock_minimo}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
          </tr>
        `;

        let nombreCompleto = nombreProducto;
        if(inv.talla && inv.talla !== 'N/A') nombreCompleto += ` - ${inv.talla}`;
        if(inv.color && inv.color !== 'N/A') nombreCompleto += ` - ${inv.color}`;

        if(selectEntrada) selectEntrada.innerHTML += `<option value="${idVariante}">${nombreCompleto} (Stock: ${inv.stock_actual})</option>`;
        if(selectSalida) selectSalida.innerHTML += `<option value="${idVariante}">${nombreCompleto} (Stock: ${inv.stock_actual})</option>`;
        
        if(datalistVentas) {
          datalistVentas.innerHTML += `<option value="${nombreCompleto} (Stock disp: ${inv.stock_actual})" data-id="${idVariante}"></option>`;
        }
      });
    } catch (error) {
      console.error("Error cargando inventario:", error);
      targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos.</td></tr>';
    }
  },

  cargarAlertas: async () => {
    const tbody = document.getElementById('tabla-alertas-body') || document.getElementById('tabla-alertas');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando...</td></tr>';
    
    try {
      const alertas = await API.get('alertas');
      tbody.innerHTML = '';

      const alertasPendientes = alertas.filter(alerta => alerta.estado !== '✅ Resuelto' && alerta.estado !== 'resuelta');
      const cantidadAlertas = alertasPendientes.length;
      
      const elementoTarjeta = document.getElementById('stat-alertas');
      if (elementoTarjeta) {
        elementoTarjeta.textContent = cantidadAlertas;
        if (cantidadAlertas === 0) {
          elementoTarjeta.classList.remove('text-danger');
          elementoTarjeta.classList.add('text-success');
        } else {
          elementoTarjeta.classList.remove('text-success');
          elementoTarjeta.classList.add('text-danger');
        }
      }

      if (alertas.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-success py-4">
              <i class="bi bi-check-circle-fill fs-5 d-block mb-2"></i>Todo el inventario está en niveles óptimos.
            </td>
          </tr>`;
        return;
      }

      alertas.forEach(alerta => {
        const productoNombre = alerta.producto || alerta.nombre || 'Desconocido';
        const tipoEvento = alerta.tipo_evento || 'Stock Bajo';
        const stockActual = alerta.stock_actual || alerta.valor_actual || 0;
        const puntoReorden = alerta.punto_reorden || alerta.valor_umbral || 5;
        const estado = alerta.estado || 'Crítico';

        let badgeClass = 'bg-warning text-dark';
        if (estado.includes('Agotado')) badgeClass = 'bg-danger';
        if (estado.includes('Resuelto')) badgeClass = 'bg-success';
        
        tbody.innerHTML += `
          <tr>
            <td class="fw-bold">${productoNombre}</td>
            <td>${tipoEvento}</td>
            <td class="fw-bold ${estado.includes('Agotado') ? 'text-danger' : (estado.includes('Resuelto') ? 'text-success' : 'text-warning')}">${stockActual}</td>
            <td>${puntoReorden}</td>
            <td><span class="badge ${badgeClass}">${estado}</span></td>
          </tr>
        `;
      });
    } catch (error) {
      console.error("Error cargando alertas:", error);
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar el monitor de alertas.</td></tr>';
    }
  },

  cargarProveedores: async () => {
    const tbody = document.getElementById('tabla-proveedores-body'); 
    const targetBody = tbody ? tbody : document.getElementById('tabla-proveedores');
    const selectProdProveedor = document.getElementById('prod_proveedor'); 

    if(!targetBody) return; 

    targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando...</td></tr>';
    
    try {
      const proveedores = await API.get('proveedores'); 
      targetBody.innerHTML = '';

      if(selectProdProveedor) selectProdProveedor.innerHTML = '<option value="">Seleccionar</option>';

      if (proveedores.length === 0) {
        targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay proveedores registrados.</td></tr>';
        return;
      }

      proveedores.forEach(prov => {
        let estadoBadge = prov.estado === 'activo' 
          ? '<span class="badge bg-success bg-opacity-10 text-success">Activo</span>'
          : '<span class="badge bg-secondary bg-opacity-10 text-secondary">Inactivo</span>';

        targetBody.innerHTML += `
          <tr>
            <td class="text-muted fw-bold">#${prov.id_proveedor}</td>
            <td class="fw-semibold">${prov.nombre}</td>
            <td>${prov.empresa || '-'}</td>
            <td>
              <div><i class="bi bi-telephone text-muted"></i> ${prov.telefono || '-'}</div>
              <div class="small text-muted">${prov.correo || '-'}</div>
            </td>
            <td>${prov.ciudad || '-'}</td>
            <td>${estadoBadge}</td>
          </tr>
        `;

        if (selectProdProveedor) {
          selectProdProveedor.innerHTML += `<option value="${prov.id_proveedor}">${prov.nombre}</option>`;
        }
      });
    } catch (error) {
      console.error("Error cargando proveedores:", error);
      targetBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar la tabla.</td></tr>';
    }
  },

  cargarCategorias: async () => {
    const tbody = document.getElementById('tabla-categorias-body'); 
    const selectPadre = document.getElementById('cat_padre'); 
    const selectProdCategoria = document.getElementById('prod_categoria'); 
    const targetBody = tbody ? tbody : document.getElementById('tabla-categorias');
    
    if(!targetBody) return;

    targetBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando...</td></tr>';
    
    try {
      const categorias = await API.get('categorias'); 
      targetBody.innerHTML = '';

      if(selectPadre) selectPadre.innerHTML = '<option value="">Ninguna (Es categoría principal)</option>';
      if(selectProdCategoria) selectProdCategoria.innerHTML = '<option value="">Seleccionar</option>';

      if (categorias.length === 0) {
        targetBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay categorías registradas.</td></tr>';
        return;
      }

      categorias.forEach(cat => {
        let estadoBadge = cat.estado === 'activo' || cat.estado 
          ? '<span class="badge bg-success bg-opacity-10 text-success">Activo</span>'
          : '<span class="badge bg-secondary bg-opacity-10 text-secondary">Inactivo</span>';

        targetBody.innerHTML += `
          <tr>
            <td class="text-muted fw-bold">#${cat.id_categoria}</td>
            <td class="fw-semibold">${cat.nombre}</td>
            <td><span class="badge bg-light text-dark border">${cat.nombre_padre || 'Principal'}</span></td>
            <td>${cat.descripcion || '-'}</td>
            <td>${estadoBadge}</td>
          </tr>
        `;

        if(selectPadre) selectPadre.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre}</option>`;
        if(selectProdCategoria) selectProdCategoria.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre}</option>`;
      });
    } catch (error) {
      console.error("Error cargando categorías:", error);
      targetBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar la tabla.</td></tr>';
    }
  },

  cargarMarcas: async () => {
    const selectProdMarca = document.getElementById('prod_marca');
    if(!selectProdMarca) return;

    try {
      const marcas = await API.get('marcas');
      selectProdMarca.innerHTML = '<option value="">Seleccionar</option>';
      
      marcas.forEach(marca => {
        selectProdMarca.innerHTML += `<option value="${marca.id_marca}">${marca.nombre}</option>`;
      });
    } catch (error) {
      console.error("Error cargando marcas:", error);
    }
  },

  cargarVentas: async () => {
    const tbody = document.getElementById('tabla-ventas-body'); 
    const targetBody = tbody ? tbody : document.getElementById('tabla-ventas');
    
    if(!targetBody) return;

    targetBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando...</td></tr>';
    
    try {
      const ventas = await API.get('ventas'); 
      targetBody.innerHTML = '';

      if (ventas.length === 0) {
        targetBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay ventas registradas.</td></tr>';
        return;
      }

      ventas.forEach(venta => {
        let estadoBadge = venta.estado === 'completado' || venta.estado === 'pagada'
          ? '<span class="badge bg-success bg-opacity-10 text-success">Completado</span>'
          : '<span class="badge bg-warning bg-opacity-10 text-warning">Pendiente</span>';

        const fecha = new Date(venta.fecha_venta || venta.creado_en).toLocaleDateString();

        targetBody.innerHTML += `
          <tr>
            <td class="text-muted fw-bold">#${venta.id_venta}</td>
            <td>${fecha}</td>
            <td class="fw-semibold">${venta.cliente || 'Cliente General'}</td>
            <td>${venta.cantidad_total || venta.cantidad} art.</td>
            <td>
              <span class="badge bg-light text-dark border text-capitalize">${venta.canal_venta || 'Local'}</span>
              <div class="small text-muted mt-1 text-capitalize">${venta.metodo_pago || 'Efectivo'}</div>
            </td>
            <td class="fw-bold text-success">$${venta.total}</td>
            <td>${estadoBadge}</td>
          </tr>
        `;
      });
    } catch (error) {
      console.error("Error cargando ventas:", error);
      targetBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar la tabla de ventas.</td></tr>';
    }
  },

  cargarReportes: async () => {
    const kpiRotacion = document.getElementById('kpi-rotacion');
    const kpiVolumen = document.getElementById('kpi-volumen');
    const kpiIngresos = document.getElementById('kpi-ingresos');

    if (!kpiRotacion || !kpiVolumen || !kpiIngresos) return;

    try {
      const reportes = await API.get('reportes');
      
      const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      });

      kpiRotacion.innerHTML = `${reportes.rotacion || '0.0'}<span class="fs-6 text-muted">x</span>`;
      kpiVolumen.innerText = reportes.volumen_mtd || '0';
      kpiIngresos.innerText = formatter.format(reportes.ingresos_mtd || 0);

    } catch (error) {
      console.error("Error cargando reportes:", error);
      kpiRotacion.innerText = '--';
      kpiVolumen.innerText = '--';
      kpiIngresos.innerText = '--';
    }
  },

  // 🛡️ NUEVA FUNCIÓN REAL: Traer usuarios de la BD y pintarlos en la tabla
  cargarUsuarios: async () => {
    const tbody = document.getElementById('tabla-usuarios-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><div class="spinner-border spinner-border-sm"></div> Cargando usuarios...</td></tr>';
    
    try {
      const usuarios = await API.get('usuarios');
      tbody.innerHTML = '';
      
      if (!usuarios || usuarios.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados.</td></tr>';
          return;
      }

      usuarios.forEach(usr => {
        let estadoBadge = usr.estado === 'activo' 
          ? '<span class="badge bg-success bg-opacity-10 text-success">Activo</span>'
          : '<span class="badge bg-secondary bg-opacity-10 text-secondary">Inactivo</span>';
        
        let colorRol = usr.rol === 'admin' ? 'bg-primary text-white' : 'bg-light text-dark border';

        // Lógica para mostrar los botones correctos
        let botonesHTML = '';
        if (usr.id_usuario !== 1) { // Protegemos al admin principal (ID 1)
          if (usr.estado === 'activo') {
            botonesHTML = `
              <button class="btn btn-sm btn-outline-danger" onclick="App.eliminarUsuario(${usr.id_usuario})" title="Dar de baja">
                <i class="bi bi-trash"></i>
              </button>
            `;
          } else {
            botonesHTML = `
              <button class="btn btn-sm btn-outline-success" onclick="App.reactivarUsuario(${usr.id_usuario})" title="Reactivar">
                <i class="bi bi-arrow-counterclockwise"></i>
              </button>
            `;
          }
        }

        tbody.innerHTML += `
          <tr>
            <td class="text-muted fw-bold">#${usr.id_usuario}</td>
            <td class="fw-semibold">${usr.nombre}</td>
            <td>${usr.correo}</td>
            <td><span class="badge ${colorRol} text-capitalize">${usr.rol}</span></td>
            <td>${estadoBadge}</td>
            <td>${botonesHTML}</td>
          </tr>
        `;
      });
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar usuarios (Verifica que el servidor esté corriendo).</td></tr>';
    }
  },

  // 🛡️ FUNCIÓN CORREGIDA: Dar de baja a un empleado
  eliminarUsuario: async (id) => {
    if (confirm("¿Estás seguro de dar de baja a este empleado? Ya no podrá iniciar sesión.")) {
      try {
        // Hacemos la petición directa con fetch para evitar errores de api.js
        const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          App.cargarUsuarios(); // Recarga la tabla para que veas el cambio
          if(window.Swal) {
            Swal.fire('¡Dado de baja!', 'El usuario ha sido desactivado.', 'success');
          } else {
            alert("Usuario dado de baja exitosamente.");
          }
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error en el servidor al intentar eliminar.");
        }

      } catch (error) {
        console.error("Detalle del error al dar de baja:", error);
        if(window.Swal) {
          Swal.fire('Error', 'Error al dar de baja al usuario. Revisa la consola.', 'error');
        } else {
          alert("Error al dar de baja al usuario.");
        }
      }
    }
  },

  // ♻️ NUEVA FUNCIÓN: Reactivar a un empleado
  reactivarUsuario: async (id) => {
    if (confirm("¿Estás seguro de reactivar a este empleado? Podrá volver a iniciar sesión.")) {
      try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${id}/reactivar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          App.cargarUsuarios(); // Recarga la tabla
          if(window.Swal) Swal.fire('¡Reactivado!', 'El usuario vuelve a estar activo.', 'success');
          else alert("Usuario reactivado exitosamente.");
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error en el servidor al intentar reactivar.");
        }
      } catch (error) {
        console.error("Detalle del error al reactivar:", error);
        if(window.Swal) Swal.fire('Error', 'Error al reactivar al usuario.', 'error');
        else alert("Error al reactivar al usuario.");
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', App.init);