import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getConversations,
  getThread,
  sendMessage,
} from '../../services/messageService'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/format'
import Loader from '../../components/common/Loader'

function MessagesPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    getConversations()
      .then((res) => setConversations(res.data ?? []))
      .finally(() => setLoadingConvs(false))
  }, [])

  const loadThread = useCallback(() => {
    if (!userId) return
    setLoadingThread(true)
    getThread(userId)
      .then((res) => setMessages([...(res.data ?? [])].reverse()))
      .finally(() => setLoadingThread(false))
  }, [userId])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await sendMessage({ recipient_id: Number(userId), content: text })
      setText('')
      loadThread()
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Échec de l'envoi")
    }
  }

  return (
    <div>
      <h1 className="page-title">Messagerie</h1>

      <div className="two-col">
        {/* Conversations */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body">
            <h3>Conversations</h3>
            {loadingConvs ? (
              <Loader />
            ) : conversations.length === 0 ? (
              <p className="muted">Aucune conversation.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={`${c.user?.id}-${c.product?.id ?? 0}`}
                  type="button"
                  className="btn btn-outline btn-block mt-1"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => navigate(`/messages/${c.user?.id}`)}
                >
                  <span>{c.user?.name}</span>
                  {c.unread_count > 0 && <span className="cart-badge">{c.unread_count}</span>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Fil */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body">
            {!userId ? (
              <p className="muted">Sélectionnez une conversation pour afficher les messages.</p>
            ) : loadingThread ? (
              <Loader />
            ) : (
              <>
                <div className="thread">
                  {messages.length === 0 ? (
                    <p className="muted center">Démarrez la conversation.</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`bubble ${m.sender?.id === user?.id ? 'bubble-me' : 'bubble-them'}`}
                      >
                        {m.content}
                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                          {formatDate(m.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSend} className="row mt-2">
                  <input
                    className="input"
                    placeholder="Votre message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" className="btn">
                    Envoyer
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
