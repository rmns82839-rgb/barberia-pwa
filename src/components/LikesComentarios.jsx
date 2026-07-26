import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Heart, MessageCircle, Send, Trash2, CornerDownRight, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Convierte @NombreDelBarbero dentro del texto en una mención resaltada
function renderTextoConMenciones(texto) {
  const partes = texto.split(/(@\w+)/g)
  return partes.map((parte, i) =>
    parte.startsWith('@') ? (
      <span key={i} className="text-amber-600 dark:text-amber-400 font-medium">
        {parte}
      </span>
    ) : (
      <span key={i}>{parte}</span>
    )
  )
}

export default function LikesComentarios({ tipo, itemId }) {
  const { cliente } = useAuth()
  const navigate = useNavigate()

  const [totalLikes, setTotalLikes] = useState(0)
  const [miLike, setMiLike] = useState(false)
  const [comentarios, setComentarios] = useState([])
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [texto, setTexto] = useState('')
  const [respondiendoA, setRespondiendoA] = useState(null) // { id, nombre }
  const [barberos, setBarberos] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const inputRef = useRef(null)

  const cargar = () => {
    fetch(`/api/interacciones?tipo=${tipo}&item_id=${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setTotalLikes(data.total_likes || 0)
        setMiLike(data.mi_like || false)
        setComentarios(data.comentarios || [])
      })
      .catch(() => {})
  }

  useEffect(() => {
    cargar()
  }, [tipo, itemId])

  useEffect(() => {
    fetch('/api/barberos')
      .then((res) => res.json())
      .then((data) => setBarberos(data || []))
      .catch(() => {})
  }, [])

  const alDarLike = async () => {
    if (!cliente) {
      toast.info('Inicia sesión para reaccionar')
      navigate('/login')
      return
    }
    setMiLike((v) => !v)
    setTotalLikes((v) => (miLike ? v - 1 : v + 1))
    try {
      await fetch('/api/interacciones?accion=like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, item_id: itemId }),
      })
    } catch {
      cargar()
    }
  }

  const empezarRespuesta = (comentario) => {
    setRespondiendoA({ id: comentario.id, nombre: comentario.cliente_nombre })
    setTexto(`@${comentario.cliente_nombre.split(' ')[0]} `)
    inputRef.current?.focus()
  }

  const cancelarRespuesta = () => {
    setRespondiendoA(null)
    setTexto('')
  }

  const alCambiarTexto = (e) => {
    const valor = e.target.value
    setTexto(valor)

    const cursor = e.target.selectionStart
    const antesDelCursor = valor.slice(0, cursor)
    const match = antesDelCursor.match(/@(\w*)$/)
    if (match) {
      const busqueda = match[1].toLowerCase()
      const filtrados = barberos.filter((b) =>
        (b.alias || b.nombre).toLowerCase().replace(/\s/g, '').startsWith(busqueda)
      )
      setSugerencias(filtrados)
    } else {
      setSugerencias([])
    }
  }

  const elegirMencion = (barbero) => {
    const nombreMencion = (barbero.alias || barbero.nombre).replace(/\s/g, '')
    const cursor = inputRef.current?.selectionStart || texto.length
    const antes = texto.slice(0, cursor).replace(/@(\w*)$/, `@${nombreMencion} `)
    const despues = texto.slice(cursor)
    setTexto(antes + despues)
    setSugerencias([])
    inputRef.current?.focus()
  }

  const enviarComentario = async () => {
    if (!cliente) {
      toast.info('Inicia sesión para comentar')
      navigate('/login')
      return
    }
    if (!texto.trim()) return

    setEnviando(true)
    try {
      const res = await fetch('/api/interacciones?accion=comentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          item_id: itemId,
          comentario: texto.trim(),
          respuesta_a: respondiendoA?.id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setComentarios((prev) => [...prev, data.comentario])
      setTexto('')
      setRespondiendoA(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const borrarComentario = async (id) => {
    try {
      const res = await fetch('/api/interacciones?accion=comentario-borrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Quita el comentario y cualquier respuesta que colgaba de él
      setComentarios((prev) => prev.filter((c) => c.id !== id && c.respuesta_a !== id))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const principales = comentarios.filter((c) => !c.respuesta_a)
  const respuestasDe = (id) => comentarios.filter((c) => c.respuesta_a === id)

  const Comentario = ({ c, esRespuesta }) => (
    <div className={esRespuesta ? 'ml-6 mt-2' : 'mt-2'}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">
          <strong>{c.cliente_nombre}</strong>{' '}
          <span className="text-gray-700 dark:text-gray-300">{renderTextoConMenciones(c.comentario)}</span>
        </p>
        {cliente?.id === c.cliente_id && (
          <button
            onClick={() => borrarComentario(c.id)}
            aria-label="Borrar comentario"
            className="text-gray-300 hover:text-red-500 shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 mt-0.5">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {new Date(c.creado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </span>
        {!esRespuesta && (
          <button
            onClick={() => empezarRespuesta(c)}
            className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 hover:text-amber-600"
          >
            <CornerDownRight size={10} />
            Responder
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="mt-3">
      <div className="flex items-center gap-4">
        <button onClick={alDarLike} className="flex items-center gap-1.5 transition active:scale-90">
          <Heart size={20} className={miLike ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          <span className="text-sm text-gray-600 dark:text-gray-400">{totalLikes}</span>
        </button>
        <button
          onClick={() => setMostrarComentarios((v) => !v)}
          className="flex items-center gap-1.5 text-gray-400"
        >
          <MessageCircle size={19} />
          <span className="text-sm text-gray-600 dark:text-gray-400">{comentarios.length}</span>
        </button>
      </div>

      {mostrarComentarios && (
        <div className="mt-2">
          {principales.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Aún no hay comentarios.</p>
          )}

          <div className="max-h-56 overflow-y-auto pr-1">
            {principales.map((c) => (
              <div key={c.id}>
                <Comentario c={c} esRespuesta={false} />
                {respuestasDe(c.id).map((r) => (
                  <Comentario key={r.id} c={r} esRespuesta={true} />
                ))}
              </div>
            ))}
          </div>

          {respondiendoA && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1 mt-3 mb-1">
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                Respondiendo a {respondiendoA.nombre}
              </span>
              <button onClick={cancelarRespuesta} aria-label="Cancelar respuesta">
                <X size={12} className="text-amber-600" />
              </button>
            </div>
          )}

          <div className="relative mt-2">
            {sugerencias.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                {sugerencias.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => elegirMencion(b)}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  >
                    @{b.alias || b.nombre}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={texto}
                onChange={alCambiarTexto}
                placeholder="Escribe un comentario... usa @ para mencionar"
                className="flex-1 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-full px-3 py-1.5 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
              />
              <button
                onClick={enviarComentario}
                disabled={enviando || !texto.trim()}
                aria-label="Enviar comentario"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white shrink-0 disabled:opacity-40 transition active:scale-90"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}