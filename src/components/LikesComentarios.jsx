import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LikesComentarios({ tipo, itemId }) {
  const { cliente } = useAuth()
  const navigate = useNavigate()

  const [totalLikes, setTotalLikes] = useState(0)
  const [miLike, setMiLike] = useState(false)
  const [comentarios, setComentarios] = useState([])
  const [miComentario, setMiComentario] = useState('')
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const cargar = () => {
    fetch(`/api/interacciones?tipo=${tipo}&item_id=${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setTotalLikes(data.total_likes || 0)
        setMiLike(data.mi_like || false)
        setComentarios(data.comentarios || [])
        setMiComentario(data.mi_comentario || '')
      })
      .catch(() => {})
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, itemId])

  const requiereLogin = () => {
    toast.info('Inicia sesión para reaccionar o comentar')
    navigate('/login')
  }

  const alternarLike = async () => {
    if (!cliente) return requiereLogin()
    setMiLike((v) => !v)
    setTotalLikes((v) => (miLike ? v - 1 : v + 1))
    try {
      const res = await fetch('/api/interacciones?accion=like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, item_id: itemId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      cargar() // revertir si falló
    }
  }

  const enviarComentario = async () => {
    if (!cliente) return requiereLogin()
    setEnviando(true)
    try {
      const res = await fetch('/api/interacciones?accion=comentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, item_id: itemId, comentario: miComentario }),
      })
      if (!res.ok) throw new Error()
      toast.success('Comentario guardado')
      cargar()
    } catch {
      toast.error('No se pudo guardar el comentario')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-3">
        <button
          onClick={alternarLike}
          className="flex items-center gap-1 text-xs transition active:scale-95"
        >
          <Heart size={16} className={miLike ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'} />
          <span className="text-gray-500 dark:text-gray-400">{totalLikes}</span>
        </button>
        <button
          onClick={() => setMostrarComentarios((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
        >
          <MessageCircle size={15} />
          {comentarios.length}
        </button>
      </div>

      {mostrarComentarios && (
        <div className="mt-2 space-y-1.5">
          {comentarios.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Sé el primero en comentar.</p>
          )}
          {comentarios.slice(0, 4).map((c) => (
            <p key={c.id} className="text-xs text-gray-600 dark:text-gray-400">
              <strong>{c.cliente_nombre}:</strong> {c.comentario}
            </p>
          ))}

          <div className="flex items-center gap-1 mt-1.5">
            <input
              type="text"
              value={miComentario}
              onChange={(e) => setMiComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2 py-1 text-xs"
            />
            <button
              onClick={enviarComentario}
              disabled={enviando}
              aria-label="Enviar"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shrink-0 disabled:opacity-50"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}