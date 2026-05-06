import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 1. Total de Referencias (Productos registrados)
    const [[productos]] = await db.query(`
      SELECT COUNT(*) as total FROM productos
    `);

    // 2. Quiebre de Stock (Productos por debajo o igual al mínimo)
    const [[alertas]] = await db.query(`
      SELECT COUNT(*) as total
      FROM inventario
      WHERE stock_actual <= stock_minimo
    `);

    // 3. INGRESOS TOTALES (Más profesional: Suma el dinero de todas las ventas)
    // Nota: Lo dejamos sin filtro de fecha por ahora para que cuente las ventas de prueba de 2026
    const [[ventas]] = await db.query(`
      SELECT IFNULL(SUM(total), 0) as total
      FROM ordenes_venta
      WHERE estado IN ('pagada', 'completada')
    `);

    // 4. Total de Proveedores 
    const [[proveedores]] = await db.query(`
      SELECT COUNT(*) as total FROM proveedores
    `);

    // Le damos formato al dinero (ej: 15000 -> 15.000)
    const ingresosFormateados = new Intl.NumberFormat('es-CO').format(ventas.total);

    // Enviamos el JSON exacto
    res.json([{
      total_productos: productos.total,
      stock_critico: alertas.total,
      ventas_hoy: ingresosFormateados, // Mantenemos el nombre 'ventas_hoy' para no romper tu HTML
      total_proveedores: proveedores.total
    }]);

  } catch (error) {
    console.error("Error al cargar las estadísticas del dashboard:", error);
    res.status(500).json({ error: "Error interno obteniendo los datos del dashboard" });
  }
});

export default router;