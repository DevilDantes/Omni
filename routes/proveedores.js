import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET: Obtener la lista de proveedores
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id_proveedor, 
        nombre, 
        /* Creamos una columna "empresa" virtual y vacía para que el frontend no falle */
        '' AS empresa, 
        telefono, 
        correo, 
        ciudad, 
        estado 
      FROM proveedores
      ORDER BY id_proveedor DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ error: "Error al obtener la lista de proveedores" });
  }
});

// ➕ POST: Guardar un nuevo proveedor
router.post('/', async (req, res) => {
  try {
    const { 
      nombre, 
      correo, 
      telefono, 
      ciudad, 
      empresa 
    } = req.body;

    // EL TRUCO: Unimos la empresa y el contacto en un solo texto.
    // Ejemplo: "Importadora XYZ (Contacto: Juan Pérez)"
    let nombreParaGuardar = nombre;
    
    if (empresa && nombre) {
      nombreParaGuardar = `${empresa} (Contacto: ${nombre})`;
    } else if (empresa) {
      // Si solo escriben la empresa pero no el nombre
      nombreParaGuardar = empresa;
    }

    const [result] = await db.query(`
      INSERT INTO proveedores (
        nombre, 
        correo, 
        telefono, 
        ciudad, 
        estado
      ) VALUES (?, ?, ?, ?, 'activo')
    `, [
      nombreParaGuardar, 
      correo || '',    
      telefono || '',  
      ciudad || ''
    ]);

    res.json({ 
      ok: true, 
      id_proveedor: result.insertId,
      message: "Proveedor registrado exitosamente" 
    });

  } catch (error) {
    console.error("Error al guardar proveedor:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error al guardar el proveedor",
      details: error.message 
    });
  }
});

export default router;