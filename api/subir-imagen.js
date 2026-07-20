import { put } from "@vercel/blob"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export const config = {
  api: {
    bodyParser: false,
  },
}

function leerBinario(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks)))
  })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const token = process.env.FOTOS_READ_WRITE_TOKEN
    console.log("BLOB token existe:", !!token)

    if (!token) {
      return res.status(500).json({ error: "Token de Blob no configurado" })
    }

    const nombreArchivo = req.query.filename
    if (!nombreArchivo) {
      return res.status(400).json({ error: "Falta el nombre del archivo" })
    }

    const buffer = await leerBinario(req)
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" })
    }

    const blob = await put(`productos/${Date.now()}-${nombreArchivo}`, buffer, {
      access: "public",
      token: token,
    })

    return res.status(200).json({ url: blob.url })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}