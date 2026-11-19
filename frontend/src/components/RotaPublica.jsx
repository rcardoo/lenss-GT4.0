import { Navigate, Outlet } from 'react-router-dom'
import { estadoDaSessao } from '../api.js'

function RotaPublica() {
  if (estadoDaSessao() === 'ok') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RotaPublica
