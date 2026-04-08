# OmniSynch Inventory System

## Descripción
OmniSynch Automations es un sistema ERP de inventario diseñado para pequeñas y medianas empresas (PYMES). Permite gestionar productos, inventario, ventas, proveedores, clientes y más, con una interfaz web intuitiva y un backend robusto.

## Características
- Gestión de productos, categorías, marcas y proveedores
- Control de inventario en tiempo real
- Dashboard con métricas y alertas
- Sistema de ventas y reportes
- Autenticación de usuarios
- Interfaz responsive con Bootstrap

## Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL (Aiven Cloud)
- **Autenticación**: JSON Web Tokens (JWT)
- **Otros**: CORS, SweetAlert2

## Estructura del Proyecto
```
OmniSync Automations/
├── index.html          # Página principal/landing
├── login.html          # Página de login
├── login.js            # Lógica de autenticación del frontend
├── panel.html          # Panel de administración
├── tienda.html         # Vista de tienda (posiblemente para ventas)
├── package.json        # Dependencias del frontend (JWT)
├── README.md           # Este archivo
├── backend/
│   ├── db.js           # Configuración de la base de datos MySQL
│   ├── package.json    # Dependencias del backend
│   ├── server.js       # Servidor principal
│   └── routes/         # Rutas de la API
│       ├── alertas.js
│       ├── auth.js
│       ├── categorias.js
│       ├── clientes.js
│       ├── dashboard.js
│       ├── inventario.js
│       ├── marcas.js
│       ├── productos.js
│       ├── proveedores.js
│       ├── reportes.js
│       ├── usuarios.js
│       └── ventas.js
├── css/
│   └── styles.css      # Estilos personalizados
├── img/                # Imágenes y recursos
└── js/
    ├── api.js          # Cliente API para comunicación con el backend
    ├── app.js          # Lógica principal de la aplicación
    ├── guard.js        # Guardia de rutas/autenticación
    └── ui.js           # Utilidades de interfaz de usuario
```

## Instalación

### Prerrequisitos
- Node.js (versión 14 o superior)
- MySQL (o acceso a una instancia MySQL, como Aiven Cloud)
- Un servidor web (como Apache en XAMPP para el frontend)

### Backend
1. Navega al directorio `backend`:
   ```
   cd backend
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura la base de datos en `backend/db.js` (actualmente configurado para Aiven Cloud).

4. Inicia el servidor:
   ```
   npm start
   ```
   El servidor se ejecutará en `http://localhost:3000`.

### Frontend
1. El frontend está compuesto por archivos HTML estáticos. Puedes servirlos usando un servidor web como Apache (en XAMPP) o cualquier servidor HTTP.

2. Coloca la carpeta del proyecto en el directorio raíz de tu servidor web (por ejemplo, `htdocs` en XAMPP).

3. Accede a `http://localhost` (o la URL de tu servidor) para ver la aplicación.

## Configuración

### Base de Datos
El proyecto está configurado para usar MySQL en Aiven Cloud. Si deseas usar una base de datos local o diferente:
- Edita `backend/db.js` con tus credenciales de MySQL.
- Asegúrate de que la base de datos `omnisynch_inventory` exista y tenga las tablas necesarias.

### API
En `js/api.js`, la `BASE_URL` apunta a `http://localhost:3000/api`. Si tu backend corre en un puerto diferente, actualiza esta URL.

## Uso
1. Abre `index.html` en tu navegador para la página principal.
2. Usa `login.html` para autenticarte.
3. Una vez logueado, accede a `panel.html` para gestionar el inventario.
4. El backend proporciona endpoints RESTful para todas las operaciones CRUD.

## Endpoints de la API
- `GET /api/health` - Verificar estado del servidor y BD
- `POST /api/auth/login` - Autenticación
- `GET /api/productos` - Obtener productos
- `POST /api/producto` - Crear producto
- Y muchos más en las rutas correspondientes.

## Contribución
Para contribuir al proyecto:
1. Haz un fork del repositorio.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia
Este proyecto está bajo la Licencia ISC.

## Contacto
Para preguntas o soporte, contacta al equipo de desarrollo.