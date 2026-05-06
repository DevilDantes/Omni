import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// 🟢 1. OBTENER la lista de usuarios para la tabla
router.get('/', async (req, res) => {
  try {
    const [usuarios] = await db.query(`SELECT id_usuario, nombre, correo, rol, estado FROM usuarios`);
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// 🔵 2. CREAR un nuevo empleado desde el panel Admin
router.post('/', async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  try {
    // Revisar si el correo ya existe para no duplicar
    const [existe] = await db.query('SELECT correo FROM usuarios WHERE correo = ?', [correo]);
    if (existe.length > 0) return res.status(400).json({ error: 'El correo ya está registrado' });

    // Insertar en tu tabla exactamente como me indicaste
    await db.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol, estado) VALUES (?, ?, ?, ?, 'activo')`,
      [nombre, correo, password, rol]
    );
    res.json({ ok: true, message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// 🔴 3. DAR DE BAJA a un empleado (Desactivarlo)
router.delete('/:id', async (req, res) => {
  try {
    await db.query(`UPDATE usuarios SET estado = 'inactivo' WHERE id_usuario = ?`, [req.params.id]);
    res.json({ ok: true, message: 'Usuario dado de baja' });
  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// 🟢 5. REACTIVAR a un empleado (Cambiar estado a activo)
router.put('/:id/reactivar', async (req, res) => {
  try {
    await db.query(`UPDATE usuarios SET estado = 'activo' WHERE id_usuario = ?`, [req.params.id]);
    res.json({ ok: true, message: 'Usuario reactivado exitosamente' });
  } catch (error) {
    console.error("Error al reactivar:", error);
    res.status(500).json({ error: 'Error al reactivar usuario' });
  }
});

// ✏️ 4. ACTUALIZAR Perfil de Usuario (Tu código original intacto)
router.put('/perfil', async (req, res) => {
  const { correo, nombre, password } = req.body; // Usamos el correo como identificador

  try {
    let query;
    let params;

    if (password && password.trim() !== '') {
      // Si envió contraseña, actualizamos nombre y contraseña
      query = `UPDATE usuarios SET nombre = ?, password_hash = ? WHERE correo = ?`;
      params = [nombre, password, correo];
    } else {
      // Si la contraseña viene vacía, solo actualizamos el nombre
      query = `UPDATE usuarios SET nombre = ? WHERE correo = ?`;
      params = [nombre, correo];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ ok: true, message: "Perfil actualizado exitosamente" });

  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;