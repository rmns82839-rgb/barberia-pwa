import { neon } from "@neondatabase/serverless"
import { scryptSync } from "crypto"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

function verificarPassword(password, hashGuardado) {
  const [salt, hashOriginal] = hashGuardado.split(":")
  const hashNuevo = scryptSync(password, salt, 64).toString("hex")
  return hashNuevo === hashOriginal
}

function leerBody(req) {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (chunk) => (data += chunk))
    req.on("end", () => resolve(data))
  })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const raw = await leerBody(req)
    let usuario, password
    try {
      const parsed = JSON.parse(raw)
      usuario = parsed.usuario
      password = parsed.password
    } catch {
      return res.status(400).json({ error: "JSON inválido" })
    }

    if (!usuario || !password) {
      return res.status(400).json({ error: "Faltan usuario o password" })
    }

    const sql = neon(process.env.DATABASE_URL)
    const admins = await sql`SELECT id, usuario, password_hash FROM admins WHERE usuario = ${usuario}`

    if (admins.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" })
    }

    const admin = admins[0]
    if (!verificarPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" })
    }

    // Login correcto: devolvemos datos básicos (sin el hash)
    return res.status(200).json({ admin: { id: admin.id, usuario: admin.usuario } })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}