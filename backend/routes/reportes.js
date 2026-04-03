import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🔍 GET: Obtener KPIs para el Dashboard Analítico
router.get('/', async (req, res) => {
  try {
    // 1. Volumen de Ventas (Total sin filtro de fecha)
    const [volumenResult] = await db.query(`
      SELECT IFNULL(SUM(d.cantidad), 0) AS volumen_mtd 
      FROM ordenes_venta o
      JOIN detalle_orden_venta d ON o.id_orden_venta = d.id_orden_venta
      WHERE o.estado IN ('pagada', 'completada')
    `);

    // 2. Ingresos Totales (Sin filtro de fecha)
    const [ingresosResult] = await db.query(`
      SELECT IFNULL(SUM(total), 0) AS ingresos_mtd 
      FROM ordenes_venta 
      WHERE estado IN ('pagada', 'completada')
    `);

    // 3. Índice de Rotación (Total de salidas / Stock actual)
    const [rotacionResult] = await db.query(`
      SELECT 
        (SELECT IFNULL(SUM(cantidad), 0) FROM movimientos_inventario WHERE tipo_movimiento = 'salida') AS total_salidas,
        (SELECT IFNULL(SUM(stock_actual), 1) FROM inventario) AS total_stock
    `);

    const salidas = parseInt(rotacionResult[0].total_salidas);
    let stock = parseInt(rotacionResult[0].total_stock);
    if (stock === 0) stock = 1; // Para evitar error matemático (dividir entre cero)

    const rotacion = (salidas / stock).toFixed(1); // Redondear a 1 decimal

    res.json({
      rotacion: rotacion,
      volumen_mtd: parseInt(volumenResult[0].volumen_mtd),
      ingresos_mtd: parseFloat(ingresosResult[0].ingresos_mtd)
    });
    
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({ error: "Error al cargar los KPIs" });
  }
});

export default router;