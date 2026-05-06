import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET: Obtener el historial completo de ventas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ov.id_orden_venta AS id_venta,
        ov.numero_orden,
        ov.fecha_orden AS fecha_venta,
        c.nombre AS cliente,
        (SELECT SUM(cantidad) FROM detalle_orden_venta WHERE id_orden_venta = ov.id_orden_venta) AS cantidad,
        ov.canal_venta,
        (SELECT metodo_pago FROM pagos_venta WHERE id_orden_venta = ov.id_orden_venta LIMIT 1) AS metodo_pago,
        ov.total,
        ov.estado
      FROM ordenes_venta ov
      LEFT JOIN clientes c ON ov.id_cliente = c.id_cliente
      ORDER BY ov.id_orden_venta DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener el historial de ventas" });
  }
});

// ➕ POST: Procesar una nueva venta desde el Carrito (¡Con Transacción SQL!)
router.post('/', async (req, res) => {
  const connection = await db.getConnection(); 

  try {
    // 💡 AHORA RECIBIMOS LA LISTA DEL CARRITO (detalles) Y LOS TOTALES
    const { 
      numero_orden, id_cliente, canal_venta, estado, 
      subtotal, total, observaciones, detalles 
    } = req.body;

    const id_usuario = 1; // Admin por defecto
    const id_almacen = 1; // Bodega principal

    await connection.beginTransaction(); 

    // 1. Crear la Orden de Venta Principal
    const [resOrden] = await connection.query(`
      INSERT INTO ordenes_venta (numero_orden, id_cliente, id_usuario, canal_venta, estado, subtotal, total) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [numero_orden || `WEB-${Date.now()}`, id_cliente || 1, id_usuario, canal_venta || 'online', estado || 'pagada', subtotal, total]);
    
    const id_orden_venta = resOrden.insertId;

    // 2. Procesar CADA PRODUCTO del carrito
    for (let item of detalles) {
      const qty = parseInt(item.cantidad) || 1;
      const precio_unitario = parseFloat(item.precio_unitario) || 0;
      const id_producto = item.id_producto;

      // Buscar cuál es la variante principal de este producto
      const [varData] = await connection.query(
        `SELECT id_variante FROM producto_variantes WHERE id_producto = ? LIMIT 1`, 
        [id_producto]
      );

      if (varData.length === 0) throw new Error(`El producto ${item.nombre} no tiene una variante configurada.`);
      const id_variante = varData[0].id_variante;

      // Buscar su ID en el inventario para poder descontarlo
      const [invData] = await connection.query(
        `SELECT id_inventario, stock_actual FROM inventario WHERE id_variante = ? AND id_almacen = ? FOR UPDATE`,
        [id_variante, id_almacen]
      );

      let id_inventario = null;
      if (invData.length > 0) {
        id_inventario = invData[0].id_inventario;
      }

      // Insertar en el detalle de la orden
      await connection.query(`
        INSERT INTO detalle_orden_venta (id_orden_venta, id_variante, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [id_orden_venta, id_variante, qty, precio_unitario, qty * precio_unitario]);

      // Descontar inventario (Solo si está registrado en bodega)
      if (id_inventario) {
        await connection.query(`
          UPDATE inventario SET stock_actual = stock_actual - ? WHERE id_inventario = ?
        `, [qty, id_inventario]);

        // Registrar el Movimiento (Kardex)
        await connection.query(`
          INSERT INTO movimientos_inventario (id_inventario, id_producto, id_variante, id_almacen, id_usuario, tipo_movimiento, cantidad)
          VALUES (?, ?, ?, ?, ?, 'salida', ?)
        `, [id_inventario, id_producto, id_variante, id_almacen, id_usuario, qty]);
      }
    }

    // 3. Registrar el Pago
    const metodo_pago = observaciones && observaciones.includes('tarjeta') ? 'tarjeta' : 'efectivo';
    await connection.query(`
      INSERT INTO pagos_venta (id_orden_venta, metodo_pago, monto, estado)
      VALUES (?, ?, ?, 'aprobado')
    `, [id_orden_venta, metodo_pago, total]);

    // ¡Todo salió bien! Guardamos
    await connection.commit();
    connection.release();

    res.json({ ok: true, message: "Venta procesada exitosamente", id_orden: id_orden_venta });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error al procesar la venta:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;