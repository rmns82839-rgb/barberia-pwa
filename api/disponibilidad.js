import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const DURACION_MIN = 45

export default async function handler(req, res) {
  const barbero_id = req.query.barbero_id
  const fecha = req.query.fecha // formato YYYY-MM-DD

  if (!barbero_id || !fecha) {
    return res.status(400).json({ error: "Faltan barbero_id o fecha" })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    // 1. ¿Hay una excepción para esa fecha? (cierre o horario especial)
    const excepcion = await sql`
      SELECT cerrado, abre, cierra FROM horario_excepciones WHERE fecha = ${fecha}
    `

    let abre, cierra

    if (excepcion.length > 0) {
      if (excepcion[0].cerrado) {
        return res.status(200).json({ disponibles: [], mensaje: "Cerrado ese día" })
      }
      abre = excepcion[0].abre
      cierra = excepcion[0].cierra
    } else {
      // 2. Si no hay excepción, usamos el horario semanal
      const diaSemana = new Date(fecha + "T00:00:00").getDay() // 0=domingo ... 6=sábado
      const horario = await sql`
        SELECT abre, cierra, activo FROM horario_semanal WHERE dia_semana = ${diaSemana}
      `
      if (horario.length === 0 || !horario[0].activo || !horario[0].abre) {
        return res.status(200).json({ disponibles: [], mensaje: "Cerrado ese día" })
      }
      abre = horario[0].abre
      cierra = horario[0].cierra
    }

    // 3. Generamos todos los bloques de 45 min entre abre y cierra
    const bloques = []
    let [h, m] = abre.split(":").map(Number)
    const [hCierra, mCierra] = cierra.split(":").map(Number)
    const finMinutos = hCierra * 60 + mCierra

    while (h * 60 + m + DURACION_MIN <= finMinutos) {
      const hora = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      bloques.push(hora)
      m += DURACION_MIN
      while (m >= 60) {
        m -= 60
        h += 1
      }
    }

    // 4. Traemos las horas ya ocupadas de ese barbero ese día
    const ocupadas = await sql`
      SELECT to_char(hora, 'HH24:MI') AS hora
      FROM citas
      WHERE barbero_id = ${barbero_id}
        AND fecha = ${fecha}
        AND estado != 'cancelada'
    `
    const horasOcupadas = ocupadas.map((o) => o.hora)

    // 5. Filtramos: solo devolvemos los bloques libres
    const disponibles = bloques.filter((b) => !horasOcupadas.includes(b))

    return res.status(200).json({ disponibles })
  } catch (error) {
    console.error("ERROR REAL:", error.message)
    return res.status(500).json({ error: error.message })
  }
}