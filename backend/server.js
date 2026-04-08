import express from 'express';
import cors from 'cors';
import { db } from './db.js';

import productos from './routes/productos.js';
import inventario from './routes/inventario.js';
import dashboard from './routes/dashboard.js';
import alertas from './routes/alertas.js';
import proveedores from './routes/proveedores.js';
import categorias from './routes/categorias.js';
import ventas from './routes/ventas.js';
import reportes from './routes/reportes.js';
import marcas from './routes/marcas.js';
import auth from './routes/auth.js';
import usuarios from './routes/usuarios.js';
import clientes from './routes/clientes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', auth);

// 🔥 RUTAS
app.use('/api/productos', productos);
app.use('/api/producto', productos); // para POST
app.use('/api/inventario', inventario);
app.use('/api/dashboard', dashboard);
app.use('/api/alertas', alertas);
app.use('/api/proveedores', proveedores);
app.use('/api/categorias', categorias);
app.use('/api/ventas', ventas);
app.use('/api/reportes', reportes);
app.use('/api/marcas', marcas);
app.use('/api/usuarios', usuarios);
app.use('/api/clientes', clientes);

app.get('/api/health', async (req, res) => {
    try {
        // Haces una consulta súper rápida a tu BD para comprobar que está viva
        await db.query('SELECT 1'); 
        res.status(200).json({ status: 'ok', message: 'Servicios en línea' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Fallo en Base de Datos' });
    }
});

app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});