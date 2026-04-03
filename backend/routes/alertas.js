import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 💡 AHORA TRAEMOS TODO: Pendientes y Resueltas, pero las diferenciamos en la vista
    const [rows] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' (Talla: ', IFNULL(v.talla, 'N/A'), ' - Color: ', IFNULL(v.color, 'N/A'), ')') AS producto,
        IF(a.tipo_alerta = 'stock_cero', 'Stock Cero', 'Stock Bajo') AS tipo_evento,
        a.valor_actual,
        a.valor_umbral,
        IF(a.estado = 'resuelta', '✅ Resuelto', IF(a.tipo_alerta = 'stock_cero', '🔴 Agotado', '⚠️ Crítico')) AS estado
      FROM alertas a
      JOIN inventario i ON a.id_inventario = i.id_inventario
      JOIN producto_variantes v ON i.id_variante = v.id_variante
      JOIN productos p ON v.id_producto = p.id_producto
      ORDER BY a.estado ASC, a.id_alerta DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener alertas del historial:", error);
    res.status(500).json({ error: "Error interno al cargar las alertas" });
  }
});

export default router;