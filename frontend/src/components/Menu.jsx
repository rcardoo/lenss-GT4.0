import { Link, NavLink, useNavigate } from 'react-router-dom'
import { House, User, SlidersHorizontal, Plus, LogOut } from 'lucide-react'
import TextAnimate from './TextAnimate.jsx'
import Avatar from './Avatar.jsx'
import { sairDaConta } from '../api.js'
import { useUsuario } from './UsuarioContexto.jsx'
import './Menu.css'

function Menu() {
  const navegar = useNavigate()
  const { pessoa } = useUsuario()

  async function sair() {
    await sairDaConta()
    navegar('/login')
  }

  return (
    <header className="menu-lenss">
      <nav className="menu-barra" aria-label="Principal">
        <Link to="/" className="menu-logo-link" aria-label="LENSS, ir para o feed">
          <TextAnimate className="menu-logo">
            LENSS
          </TextAnimate>
        </Link>

        <ul className="menu-links">
          <li>
            <NavLink className="menu-link" to="/" end title="Feed">
              <House size={20} /> Feed
            </NavLink>
          </li>
          <li>
            <NavLink className="menu-link" to="/perfil" title="Perfil">
              <User size={20} /> Perfil
            </NavLink>
          </li>
          <li>
            <NavLink className="menu-link" to="/configuracoes" title="Configurações">
              <SlidersHorizontal size={20} /> Configurações
            </NavLink>
          </li>
        </ul>

        <div className="menu-acoes">
          <Link to="/novo" className="botao menu-postar" aria-label="Postar foto" title="Postar foto">
            <Plus size={20} /> <span className="menu-postar-texto">Postar foto</span>
          </Link>

          <NavLink to="/configuracoes" className="redondo menu-so-celular" aria-label="Configurações">
            <SlidersHorizontal size={20} />
          </NavLink>

          <span className="menu-divisoria" aria-hidden="true"></span>

          <Link to="/perfil" className="menu-avatar" aria-label="Seu perfil" title="Seu perfil">
            {pessoa && <Avatar foto={pessoa.foto} alt="" />}
            {pessoa && (
              <span className="menu-avatar-nomes">
                <strong>{pessoa.nome}</strong>
                <span>@{pessoa.usuario}</span>
              </span>
            )}
          </Link>

          <button type="button" className="redondo menu-so-computador menu-sair" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut size={20} /> <span className="menu-sair-texto">Sair</span>
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Menu
