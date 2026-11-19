import { useEffect, useRef, useState } from 'react'
import { Ellipsis } from 'lucide-react'
import './MenuOpcoes.css'

function MenuOpcoes({ opcoes, rotulo = 'Mais opções', className = '' }) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef(null)

  useEffect(() => {
    if (!aberto) return

    function cliqueFora(evento) {
      if (caixa.current && !caixa.current.contains(evento.target)) setAberto(false)
    }
    function tecla(evento) {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', cliqueFora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', cliqueFora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  return (
    <div className={`opcoes ${aberto ? 'opcoes-aberto' : ''} ${className}`} ref={caixa}>
      <button
        type="button"
        className="opcoes-botao"
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
      >
        <Ellipsis size={20} />
      </button>

      {aberto && (
        <div className="opcoes-lista" role="menu">
          {opcoes.map((opcao) => {
            const Icone = opcao.icone
            return (
              <button
                key={opcao.texto}
                type="button"
                role="menuitem"
                className={opcao.perigo ? 'opcoes-item opcoes-perigo' : 'opcoes-item'}
                onClick={() => {
                  setAberto(false)
                  opcao.aoClicar()
                }}
              >
                {Icone && <Icone size={18} />} {opcao.texto}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MenuOpcoes
