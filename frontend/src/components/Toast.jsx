import { useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

export function useToast() {
  const [texto, setTexto] = useState('')
  const relogio = useRef(null)

  const mostrar = useCallback((novoTexto) => {
    setTexto(novoTexto)
    clearTimeout(relogio.current)
    relogio.current = setTimeout(() => setTexto(''), 2600)
  }, [])

  useEffect(() => () => clearTimeout(relogio.current), [])

  const elemento = texto ? (
    <div className="toast-lenss" role="status">
      <Check size={18} /> {texto}
    </div>
  ) : null

  return [elemento, mostrar]
}
