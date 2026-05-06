import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET: Buscar clientes (Para validar el Inicio de Sesión y el Panel)
router.get('/', async (req, res) => {
  try {
    // Traemos todas las columnas para que se vean completas en tu panel
    const [rows] = await db.query('SELECT * FROM clientes ORDER BY id_cliente DESC');
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error de base de datos" });
  }
});

// ➕ POST: Registrar un nuevo cliente desde tienda.html
router.post('/', async (req, res) => {
  try {
    // 1. Recibimos TODOS los datos que manda el nuevo formulario de la tienda
    const { 
      nombre_completo, tipo_documento, documento, 
      correo_electronico, telefono, direccion, ciudad, pais 
    } = req.body;
    
    // 2. Insertamos en la BD usando exactamente los nombres de tus columnas
    const [result] = await db.query(`
      INSERT INTO clientes (nombre, tipo_documento, documento, telefono, correo, direccion, ciudad, pais) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre_completo, 
      tipo_documento || 'CC', 
      documento || 'Sin registrar', 
      telefono || '0000000000',
      correo_electronico, 
      direccion || 'Sin especificar',
      ciudad || 'Sin especificar',
      pais || 'Colombia'
    ]);

    res.json({ 
      ok: true, 
      id_cliente: result.insertId, 
      message: "Cliente registrado exitosamente" 
    });

  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({ error: "No se pudo registrar. ¿El correo o documento ya está en uso?" });
  }
});

export default router;