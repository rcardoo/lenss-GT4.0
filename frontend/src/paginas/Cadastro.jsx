import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AtSign, Eye, EyeOff, TriangleAlert } from 'lucide-react'
import { URL_API, CABECALHOS, guardarSessao } from '../api.js'
import logo from '../assets/logo-lenss.png'
import { fundoSorteado } from '../fundos.js'
import './Login.css'

function Cadastro() {
  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const campoUsuario = useRef(null)
  const navegar = useNavigate()

  async function cadastrar(evento) {
    evento.preventDefault()
    setErro('')
    setCriando(true)

    try {
      const resposta = await fetch(`${URL_API}/cadastro`, {
        method: 'POST',
        headers: { ...CABECALHOS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome, usuario: usuario, senha: senha }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.erro)
        setCriando(false)
        if (resposta.status === 409) campoUsuario.current?.focus()
        return
      }

      guardarSessao(dados.expira)
      navegar('/')
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
      setCriando(false)
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

          <h1 className="visually-hidden">Criar uma conta no LENSS</h1>

          <form onSubmit={cadastrar} className="login-form">
            <div>
              <label className="rotulo" htmlFor="cadastroNome">Nome</label>
              <input
                id="cadastroNome"
                className="campo"
                type="text"
                placeholder="Como você quer aparecer"
                autoComplete="name"
                maxLength={60}
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </div>

            <div>
              <label className="rotulo" htmlFor="cadastroUsuario">Usuário</label>
              <div className="campo-com-icone">
                <AtSign size={18} className="campo-icone" aria-hidden="true" />
                <input
                  ref={campoUsuario}
                  id="cadastroUsuario"
                  className="campo"
                  type="text"
                  placeholder="seu.usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={20}
                  aria-describedby="cadastroDicaUsuario"
                  value={usuario}
                  onChange={(evento) => setUsuario(evento.target.value.replace(/^@/, '').toLowerCase())}
                />
              </div>
              <p className="cadastro-dica" id="cadastroDicaUsuario">
                3 a 20 caracteres: letras minúsculas, números, ponto ou sublinhado.
              </p>
            </div>

            <div>
              <label className="rotulo" htmlFor="cadastroSenha">Senha</label>
              <div className="campo-com-icone">
                <input
                  id="cadastroSenha"
                  className="campo login-senha"
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Pelo menos 8 caracteres"
                  autoComplete="new-password"
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

            <button className="botao login-entrar" type="submit" disabled={criando}>
              {criando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="login-trocar">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </article>
    </main>
  )
}

export default Cadastro
