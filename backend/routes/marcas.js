import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_marca, nombre FROM marcas ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener marcas" });
  }
});

export default router;