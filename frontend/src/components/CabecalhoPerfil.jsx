import { Link } from 'react-router-dom'
import { Plus, SlidersHorizontal, UserPlus, UserCheck } from 'lucide-react'
import { urlFoto } from '../api.js'
import Avatar from './Avatar.jsx'
import './CabecalhoPerfil.css'

function CabecalhoPerfil({
  usuario,
  nome,
  bio,
  foto,
  banner,
  publicacoes,
  seguidores = 0,
  seguindo = 0,
  meu = true,
  sigo = false,
  aoSeguir,
  ocupado = false,
}) {
  return (
    <section className="caixa perfil">
      <div className="perfil-banner">
        <img src={urlFoto(banner)} alt="" />
      </div>

      <div className="perfil-linha">
        <div className="perfil-avatar">
          <Avatar foto={foto} tamanho="gg" />
        </div>

        <div className="perfil-nomes">
          <h1>{nome}</h1>
          <p>@{usuario}</p>
        </div>

        {meu && (
          <div className="perfil-acoes">
            <Link to="/configuracoes" className="pill">
              <SlidersHorizontal size={18} /> Editar perfil
            </Link>
            <Link to="/novo" className="botao">
              <Plus size={18} /> Postar foto
            </Link>
          </div>
        )}
      </div>

      <div className="perfil-detalhes">
        {bio && <p className="perfil-bio">{bio}</p>}
        <p className="perfil-numeros">
          <span>
            <strong>{publicacoes}</strong> {publicacoes === 1 ? 'publicação' : 'publicações'}
          </span>
          <span>
            <strong>{seguidores}</strong> {seguidores === 1 ? 'seguidor' : 'seguidores'}
          </span>
          <span>
            <strong>{seguindo}</strong> seguindo
          </span>
        </p>

        {!meu && (
          <button
            type="button"
            className={sigo ? 'pill perfil-seguir perfil-seguindo' : 'botao perfil-seguir'}
            onClick={aoSeguir}
            disabled={ocupado}
            aria-pressed={sigo}
          >
            {sigo ? <UserCheck size={18} /> : <UserPlus size={18} />} {sigo ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>
    </section>
  )
}

export default CabecalhoPerfil
