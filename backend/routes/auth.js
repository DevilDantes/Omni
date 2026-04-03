import express from 'express';
import { db } from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
// 🔑 LLAVE MAESTRA: En el futuro esto irá en un archivo oculto (.env)
const SECRET_KEY = 'tu_super_secreto_jwt_omnisynch'; 

router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    // 1. Buscamos al usuario por correo y nos aseguramos de que esté activo
    const [usuarios] = await db.query(
      `SELECT id_usuario, nombre, correo, password_hash, rol 
       FROM usuarios 
       WHERE correo = ? AND estado = 'activo'`, 
      [correo]
    );

    // Si no existe el correo o está inactivo
    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const user = usuarios[0];

    // 2. Comparamos la contraseña
    // 🚨 NOTA: Como en tu BD de prueba guardaste '123456' en texto plano, lo comparamos directo. 
    // Más adelante implementaremos 'bcrypt' para encriptar esto como un profesional.
    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generamos el "Gafete Virtual" (Token)
    const token = jwt.sign(
      { 
        id: user.id_usuario, 
        rol: user.rol, 
        nombre: user.nombre 
      },
      SECRET_KEY,
      { expiresIn: '8h' } // El token caduca en 8 horas
    );

    // 4. Se lo enviamos al frontend
   // 4. Se lo enviamos al frontend
    res.json({
      ok: true,
      mensaje: 'Bienvenido ' + user.nombre,
      token: token,
      usuario: { 
        nombre: user.nombre, 
        rol: user.rol,
        correo: user.correo // 👈 ¡ESTO ES LO QUE FALTABA!
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;