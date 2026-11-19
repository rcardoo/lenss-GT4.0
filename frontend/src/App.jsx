import { Routes, Route, Navigate } from 'react-router-dom'
import RotaPrivada from './components/RotaPrivada.jsx'
import RotaPublica from './components/RotaPublica.jsx'
import Login from './paginas/Login.jsx'
import Cadastro from './paginas/Cadastro.jsx'
import Feed from './paginas/Feed.jsx'
import Perfil from './paginas/Perfil.jsx'
import PerfilPessoa from './paginas/PerfilPessoa.jsx'
import Configuracoes from './paginas/Configuracoes.jsx'
import NovoPic from './paginas/NovoPic.jsx'

function App() {
  return (
    <Routes>
      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>

      <Route element={<RotaPrivada />}>
        <Route path="/" element={<Feed />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil/:usuario" element={<PerfilPessoa />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/novo" element={<NovoPic />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
