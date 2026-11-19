import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AtSign, Eye, EyeOff, TriangleAlert, Clock, Trash2 } from 'lucide-react'
import { URL_API, CABECALHOS, destinoSeguro, guardarSessao } from '../api.js'
import logo from '../assets/logo-lenss.png'
import { fundoSorteado } from '../fundos.js'
import './Login.css'

function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const navegar = useNavigate()

  const local = useLocation()
  const busca = new URLSearchParams(local.search)
  const destino = destinoSeguro(local.state?.de || busca.get('de') || '/')
  const sessaoExpirou = Boolean(local.state?.expirou) || busca.get('expirou') === '1'
  const contaApagada = Boolean(local.state?.contaApagada)

  async function entrar(evento) {
    evento.preventDefault()
    setErro('')
    setEntrando(true)

    try {
      const resposta = await fetch(`${URL_API}/login`, {
        method: 'POST',
        headers: { ...CABECALHOS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario, senha: senha }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.erro)
        setEntrando(false)
        return
      }

      guardarSessao(dados.expira)
      navegar(destino, { replace: true })
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
      setEntrando(false)
    }
  }

  return (
    <main className="login">
      <img src={logo} alt="" className="login-logo-topo" aria-hidden="true" />

      <article className="caixa login-cartao">
        <div className="login-imagem">
          <img src={fundoSorteado.foto} alt="" style={{ objectPosition: fundoSorteado.posicao }} />
        </div>

        <div className="login-corpo">
          <img src={logo} alt="LENSS" className="login-logo" />

          <h1 className="visually-hidden">Entrar no LENSS</h1>

          {contaApagada && !erro && (
            <p className="aviso login-expirou" role="status">
              <Trash2 size={18} /> Sua conta foi apagada.
            </p>
          )}

          {sessaoExpirou && !erro && (
            <p className="aviso login-expirou" role="status">
              <Clock size={18} /> Sua sessão expirou. Entre de novo para continuar.
            </p>
          )}

          <form onSubmit={entrar} className="login-form">
            <div>
              <label className="rotulo" htmlFor="loginUsuario">Usuário</label>
              <div className="campo-com-icone">
                <AtSign size={18} className="campo-icone" aria-hidden="true" />
                <input
                  id="loginUsuario"
                  className="campo"
                  type="text"
                  placeholder="seu.usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={usuario}
                  onChange={(evento) => setUsuario(evento.target.value.replace(/^@/, '').toLowerCase())}
                />
              </div>
            </div>

            <div>
              <label className="rotulo" htmlFor="loginSenha">Senha</label>
              <div className="campo-com-icone">
                <input
                  id="loginSenha"
                  className="campo login-senha"
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                />
                <button
                  type="button"
                  className="login-olho campo-direita"
                  onClick={() => setVerSenha(!verSenha)}
                  aria-label={verSenha ? 'Esconder a senha' : 'Mostrar a senha'}
                  aria-pressed={verSenha}
                >
                  {verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="aviso aviso-erro" role="alert">
                <TriangleAlert size={18} /> {erro}
              </p>
            )}

            <button className="botao login-entrar" type="submit" disabled={entrando}>
              {entrando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="login-trocar">
            Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </div>
      </article>
    </main>
  )
}

export default Login
