import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET productos (Se queda igual, ¡está perfecto!)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id_producto, 
        p.nombre, 
        p.imagen_url,
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

// ➕ POST producto con Transacciones seguras
router.post('/', async (req, res) => {
  const {
    nombre, id_categoria, id_marca, id_proveedor,
    precio_compra, precio_venta, tipo, descripcion,
    imagen_url, talla, color, material, presentacion, 
    codigo_barras, stock_minimo
  } = req.body;

  // Solicitamos una conexión dedicada para la transacción
  const connection = await db.getConnection();

  try {
    // 💡 INICIAMOS LA TRANSACCIÓN: A partir de aquí nada se guarda definitivamente aún
    await connection.beginTransaction();

    const codigoBase = 'PROD-' + Math.floor(Math.random() * 1000000);

    // PASO 1: Insertar producto
    const [prodResult] = await connection.query(`
      INSERT INTO productos (
        codigo_base, nombre, descripcion, id_categoria, id_marca, id_proveedor,
        tipo_producto, precio_compra_base, precio_venta_base, impuesto_porcentaje, estado, imagen_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'activo', ?)
    `, [
      codigoBase, nombre, descripcion || '', id_categoria || null, id_marca || null,     
      id_proveedor || null, tipo || 'simple', precio_compra || 0, precio_venta || 0, imagen_url || null
    ]);

    const idProducto = prodResult.insertId; 

    // PASO 2: Insertar la variante
    const [varResult] = await connection.query(`
      INSERT INTO producto_variantes (
        id_producto, sku, codigo_barras, talla, color, 
        material, presentacion, costo_unitario, precio_venta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      idProducto, codigoBase + '-01', codigo_barras || null, talla || 'N/A', 
      color || 'N/A', material || null, presentacion || null, precio_compra || 0, precio_venta || 0
    ]);

    const idVariante = varResult.insertId; 

    // PASO 3: Crear espacio en inventario
    await connection.query(`
      INSERT INTO inventario (id_variante, id_almacen, stock_actual, stock_minimo)
      VALUES (?, 1, 0, ?)
    `, [idVariante, stock_minimo || 5]);

    // 💡 CONFIRMAMOS LA TRANSACCIÓN: Las 3 consultas salieron bien, ahora sí guardamos todo en el disco
    await connection.commit();

    res.json({ 
      ok: true, 
      id_producto: idProducto,
      message: "Producto e inventario creados exitosamente" 
    });

  } catch (error) {
    // 🚨 REVERTIMOS LA TRANSACCIÓN: Si algo falló arriba, borramos lo que se haya intentado guardar
    await connection.rollback();
    
    console.error("Error al insertar producto:", error);
    
    // Filtro para el error de precio demasiado alto
    if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
      return res.status(400).json({ error: "El precio ingresado supera el límite permitido (99,999,999)." });
    }

    res.status(500).json({ ok: false, error: "Error al guardar el producto", details: error.message });
  } finally {
    // Liberamos la conexión para que otros usuarios la puedan usar
    connection.release();
  }
});

export default router;