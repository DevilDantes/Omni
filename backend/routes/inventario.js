import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET inventario: Trae los datos para la tabla
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        v.id_variante, 
        i.id_inventario,
        p.nombre,
        v.talla,
        v.color,
        i.stock_actual,
        i.stock_minimo
      FROM inventario i
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    res.status(500).json({ error: "Error al obtener el inventario" });
  }
});

// ➕/➖ POST movimiento inventario
router.post('/', async (req, res) => {
  const { id_variante, cantidad, tipo_movimiento, observacion } = req.body; 

  const connection = await db.getConnection();

  try {
    const qty = parseInt(cantidad);
    const id_usuario = 1; 
    const id_almacen = 1; 

    await connection.beginTransaction();

    const [invRows] = await connection.query(`
      SELECT i.id_inventario, i.stock_actual, i.stock_minimo, v.id_producto 
      FROM inventario i
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      WHERE i.id_variante = ? FOR UPDATE
    `, [id_variante]);

    if (invRows.length === 0) {
      throw new Error("El producto no está registrado en el inventario.");
    }

    const { id_inventario, id_producto, stock_actual } = invRows[0];
    
    // 💡 Aseguramos que el stock_minimo sea siempre un número (si es NULL, asume 5)
    const stock_minimo_seguro = parseInt(invRows[0].stock_minimo) || 5;

    // SEGURIDAD: Evita inventario negativo
    if (tipo_movimiento === 'salida' && stock_actual < qty) {
      throw new Error(`Stock insuficiente. Intentas sacar ${qty}, pero solo hay ${stock_actual} disponibles.`);
    }

    const operador = tipo_movimiento === 'entrada' ? '+' : '-';
    await connection.query(`
      UPDATE inventario
      SET stock_actual = stock_actual ${operador} ?
      WHERE id_inventario = ?
    `, [qty, id_inventario]);

    // Calcular el nuevo stock matemático
    const nuevo_stock = tipo_movimiento === 'entrada' ? stock_actual + qty : stock_actual - qty;

    // HISTORIAL: Guardamos el registro del movimiento
    await connection.query(`
      INSERT INTO movimientos_inventario 
      (id_inventario, id_producto, id_variante, id_almacen, id_usuario, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_inventario, id_producto, id_variante, id_almacen, id_usuario, 
      tipo_movimiento, qty, observacion || 'Sin observación'
    ]);

    // ====================================================
    // 🚨 LOS "CHISMOSOS" PARA VER QUÉ ESTÁ PASANDO EN LA TERMINAL
    // ====================================================
    console.log(`\n--- 🕵️‍♂️ REVISIÓN DE ALERTA ---`);
    console.log(`Stock Anterior: ${stock_actual} | Movimiento: ${tipo_movimiento} de ${qty}`);
    console.log(`Nuevo Stock Calculado: ${nuevo_stock} | Stock Mínimo Requerido: ${stock_minimo_seguro}`);

    if (nuevo_stock <= stock_minimo_seguro) {
      console.log(`¡PELIGRO! ${nuevo_stock} es menor o igual a ${stock_minimo_seguro}. Guardando alerta en la BD...`);
      
      // Buscamos si ya existe una alerta activa
      const [alertasPendientes] = await connection.query(`
        SELECT id_alerta FROM alertas WHERE id_inventario = ? AND estado = 'pendiente'
      `, [id_inventario]);

      const tipoAlerta = nuevo_stock === 0 ? 'stock_cero' : 'stock_bajo';
      const mensaje = nuevo_stock === 0 ? 'Producto agotado.' : 'Nivel de reorden alcanzado.';

      if (alertasPendientes.length > 0) {
        console.log(`Ya existía la alerta #${alertasPendientes[0].id_alerta}. Actualizando valores...`);
        await connection.query(`
          UPDATE alertas 
          SET valor_actual = ?, tipo_alerta = ?, mensaje = ? 
          WHERE id_alerta = ?
        `, [nuevo_stock, tipoAlerta, mensaje, alertasPendientes[0].id_alerta]);
      } else {
        console.log(`Creando nueva alerta en la base de datos...`);
        await connection.query(`
          INSERT INTO alertas (id_inventario, tipo_alerta, valor_umbral, valor_actual, mensaje, estado)
          VALUES (?, ?, ?, ?, ?, 'pendiente')
        `, [id_inventario, tipoAlerta, stock_minimo_seguro, nuevo_stock, mensaje]);
      }
    } else {
      console.log(`Stock Sano (${nuevo_stock} es mayor a ${stock_minimo_seguro}). Resolviendo alertas previas si existen...`);
      await connection.query(`
        UPDATE alertas 
        SET estado = 'resuelta', fecha_resolucion = CURRENT_TIMESTAMP, id_usuario_resuelve = ? 
        WHERE id_inventario = ? AND estado = 'pendiente'
      `, [id_usuario, id_inventario]);
    }
    console.log(`------------------------------\n`);
    // ====================================================

    await connection.commit();
    res.json({ ok: true, message: "Movimiento y alertas registrados correctamente" });

  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar el movimiento:", error);
    res.status(400).json({ ok: false, error: error.message });
  } finally {
    connection.release();
  }
});

export default router;