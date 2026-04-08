import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET productos: Adaptado a tus columnas reales y con JOINs
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id_producto, 
        p.nombre, 
        p.imagen_url,         /* 💡 AÑADIDO: Solo agregué esta línea para que traiga la foto */
        c.nombre AS nombre_categoria,  
        m.nombre AS nombre_marca,      
        prov.nombre AS nombre_proveedor, 
        p.precio_venta_base, 
        p.estado 
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN marcas m ON p.id_marca = m.id_marca
      LEFT JOIN proveedores prov ON p.id_proveedor = prov.id_proveedor
      ORDER BY p.id_producto DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener la lista de productos" });
  }
});

// ➕ POST producto: Crea el producto, su variante detallada y su espacio en inventario
router.post('/', async (req, res) => {
  try {
    const {
      nombre, id_categoria, id_marca, id_proveedor,
      precio_compra, precio_venta, tipo, descripcion,
      imagen_url,            /* 💡 AÑADIDO: Permite recibir la foto cuando crees un producto nuevo */
      talla, color, material, presentacion, codigo_barras, stock_minimo
    } = req.body;

    // Generamos un código base único
    const codigoBase = 'PROD-' + Math.floor(Math.random() * 1000000);

    // PASO 1: Insertar en la tabla 'productos'
    const [prodResult] = await db.query(`
      INSERT INTO productos (
        codigo_base, nombre, descripcion, id_categoria, id_marca, id_proveedor,
        tipo_producto, precio_compra_base, precio_venta_base, impuesto_porcentaje, estado, imagen_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'activo', ?)
    `, [
      codigoBase,
      nombre,
      descripcion || '', 
      id_categoria || null, 
      id_marca || null,     
      id_proveedor || null, 
      tipo || 'simple',     
      precio_compra || 0,
      precio_venta || 0,
      imagen_url || null      /* 💡 AÑADIDO: Guarda la foto en la base de datos */
    ]);

    const idProducto = prodResult.insertId; 

    // 💡 PASO 2 ACTUALIZADO: Insertamos todos los detalles de la variante si existen
    const [varResult] = await db.query(`
      INSERT INTO producto_variantes (
        id_producto, sku, codigo_barras, talla, color, 
        material, presentacion, costo_unitario, precio_venta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      idProducto, 
      codigoBase + '-01', 
      codigo_barras || null, 
      talla || 'N/A', 
      color || 'N/A', 
      material || null, 
      presentacion || null, 
      precio_compra || 0, 
      precio_venta || 0
    ]);

    const idVariante = varResult.insertId; 

    // 💡 PASO 3 ACTUALIZADO: Crear su espacio respetando el stock_minimo que eligió el usuario (o 5 por defecto)
    await db.query(`
      INSERT INTO inventario (id_variante, id_almacen, stock_actual, stock_minimo)
      VALUES (?, 1, 0, ?)
    `, [idVariante, stock_minimo || 5]);

    res.json({ 
      ok: true, 
      id_producto: idProducto,
      message: "Producto e inventario creados exitosamente" 
    });

  } catch (error) {
    console.error("Error al insertar producto:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error al guardar el producto",
      details: error.message 
    });
  }
});

export default router;