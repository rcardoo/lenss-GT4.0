import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Menu from './Menu.jsx'
import { UsuarioProvider } from './UsuarioContexto.jsx'
import { estadoDaSessao } from '../api.js'

function RotaPrivada() {
  const local = useLocation()
  const sessao = estadoDaSessao()

  if (sessao !== 'ok') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ de: local.pathname + local.search, expirou: sessao === 'expirou' }}
      />
    )
  }

  const telaCheia = local.pathname === '/novo'

  return (
    <UsuarioProvider>
      <div className={telaCheia ? 'app app-sem-menu-celular' : 'app'}>
        <Menu />
        <main className="conteudo">
          <Outlet />
        </main>
      </div>
    </UsuarioProvider>
  )
}

export default RotaPrivada
