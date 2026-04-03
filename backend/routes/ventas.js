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

// ➕ POST: Procesar una nueva venta (¡Con Transacción SQL!)
router.post('/', async (req, res) => {
  // Pedimos una conexión dedicada para hacer la transacción
  const connection = await db.getConnection(); 

  try {
    const { 
      id_cliente, 
      id_variante, 
      cantidad, 
      canal_venta, 
      metodo_pago 
    } = req.body;

    const id_usuario = 1; // Por ahora asignamos el Admin, luego lo cambiarás por el usuario logueado
    const id_almacen = 1; // Asumimos bodega principal
    const qty = parseInt(cantidad);

    await connection.beginTransaction(); // Iniciamos la transacción segura

    // 1. Obtener datos del producto/variante (precio y id_producto)
    const [varianteData] = await connection.query(
      `SELECT id_producto, precio_venta FROM producto_variantes WHERE id_variante = ?`, 
      [id_variante]
    );

    if (varianteData.length === 0) throw new Error("La variante del producto no existe");
    
    const { id_producto, precio_venta } = varianteData[0];
    const total_venta = precio_venta * qty;

    // 2. Verificar stock en el inventario
    const [invData] = await connection.query(
      `SELECT id_inventario, stock_actual FROM inventario WHERE id_variante = ? AND id_almacen = ? FOR UPDATE`,
      [id_variante, id_almacen]
    );

    if (invData.length === 0 || invData[0].stock_actual < qty) {
      throw new Error("No hay stock suficiente para realizar esta venta");
    }
    const id_inventario = invData[0].id_inventario;

    // 3. Crear la Orden de Venta
    const numero_orden = `VEN-${Date.now()}`; // Generamos un número único
    const [resOrden] = await connection.query(`
      INSERT INTO ordenes_venta (numero_orden, id_cliente, id_usuario, canal_venta, estado, subtotal, total) 
      VALUES (?, ?, ?, ?, 'pagada', ?, ?)
    `, [numero_orden, id_cliente || null, id_usuario, canal_venta, total_venta, total_venta]);
    
    const id_orden_venta = resOrden.insertId;

    // 4. Insertar el Detalle de la Orden
    await connection.query(`
      INSERT INTO detalle_orden_venta (id_orden_venta, id_variante, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `, [id_orden_venta, id_variante, qty, precio_venta, total_venta]);

    // 5. Registrar el Pago
    await connection.query(`
      INSERT INTO pagos_venta (id_orden_venta, metodo_pago, monto, estado)
      VALUES (?, ?, ?, 'aprobado')
    `, [id_orden_venta, metodo_pago, total_venta]);

    // 6. Descontar del Inventario
    await connection.query(`
      UPDATE inventario SET stock_actual = stock_actual - ? WHERE id_inventario = ?
    `, [qty, id_inventario]);

    // 7. Registrar el Movimiento (Kardex)
    await connection.query(`
      INSERT INTO movimientos_inventario (id_inventario, id_producto, id_variante, id_almacen, id_usuario, tipo_movimiento, cantidad)
      VALUES (?, ?, ?, ?, ?, 'salida', ?)
    `, [id_inventario, id_producto, id_variante, id_almacen, id_usuario, qty]);

    // ¡Todo salió bien! Guardamos los cambios en la base de datos
    await connection.commit();
    connection.release();

    res.json({ ok: true, message: "Venta procesada exitosamente", id_orden: id_orden_venta });

  } catch (error) {
    // Si algo falló arriba, revertimos TODOS los cambios (no cobra, no descuenta inventario)
    await connection.rollback();
    connection.release();
    console.error("Error al procesar la venta:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;