import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AtSign, Camera, Check, CircleAlert, LogOut, Trash2, TriangleAlert, UserRound } from 'lucide-react'
import { chamarApi, urlFoto, IMAGENS_ACEITAS, problemaNaImagem, sairDaConta, esquecerSessao } from '../api.js'
import { useToast } from '../components/Toast.jsx'
import { useUsuario } from '../components/UsuarioContexto.jsx'
import './Configuracoes.css'

const LIMITE_BIO = 150
const FORMATO_USUARIO = /^[a-z0-9._]{3,20}$/

function Configuracoes() {
  const { pessoa, recarregar } = useUsuario()
  const navegar = useNavigate()
  const [toast, mostrarToast] = useToast()

  const [nome, setNome] = useState('')
  const [bio, setBio] = useState('')
  const [usuario, setUsuario] = useState('')
  const [novaFoto, setNovaFoto] = useState(null)
  const [novoBanner, setNovoBanner] = useState(null)
  const [previaFoto, setPreviaFoto] = useState('')
  const [previaBanner, setPreviaBanner] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [senhaApagar, setSenhaApagar] = useState('')
  const [apagando, setApagando] = useState(false)
  const [erroApagar, setErroApagar] = useState('')
  const preenchido = useRef(false)
  const seletorFoto = useRef(null)
  const seletorBanner = useRef(null)

  useEffect(() => {
    if (pessoa && !preenchido.current) {
      setNome(pessoa.nome)
      setBio(pessoa.bio)
      setUsuario(pessoa.usuario)
      preenchido.current = true
    }
  }, [pessoa])

  useEffect(() => () => previaFoto && URL.revokeObjectURL(previaFoto), [previaFoto])
  useEffect(() => () => previaBanner && URL.revokeObjectURL(previaBanner), [previaBanner])

  function escolherFoto(arquivo) {
    if (!arquivo) return
    const problema = problemaNaImagem(arquivo)
    if (problema) {
      setErro(problema)
      return
    }
    setErro('')
    setNovaFoto(arquivo)
    setPreviaFoto(URL.createObjectURL(arquivo))
  }

  function escolherBanner(arquivo) {
    if (!arquivo) return
    const problema = problemaNaImagem(arquivo)
    if (problema) {
      setErro(problema)
      return
    }
    setErro('')
    setNovoBanner(arquivo)
    setPreviaBanner(URL.createObjectURL(arquivo))
  }

  const usuarioValido = FORMATO_USUARIO.test(usuario)
  const usuarioMudou = pessoa && usuario !== pessoa.usuario
  const podeSalvar = nome.trim() !== '' && usuarioValido && !salvando

  async function salvar(evento) {
    evento.preventDefault()
    if (!podeSalvar) return

    const pacote = new FormData()
    pacote.append('nome', nome.trim())
    pacote.append('bio', bio.trim())
    pacote.append('usuario', usuario)
    if (novaFoto) pacote.append('foto', novaFoto)
    if (novoBanner) pacote.append('banner', novoBanner)

    setSalvando(true)
    setErro('')
    try {
      const antes = pessoa.usuario
      const dados = await chamarApi('/perfil', 'PATCH', pacote)
      await recarregar()
      setNovaFoto(null)
      setNovoBanner(null)
      setPreviaFoto('')
      setPreviaBanner('')
      mostrarToast(dados.usuario !== antes ? `Salvo! Agora você entra com @${dados.usuario}` : 'Alterações salvas')
    } catch (problema) {
      setErro(problema.message)
    }
    setSalvando(false)
  }

  async function sair() {
    await sairDaConta()
    navegar('/login')
  }

  async function apagarConta() {
    if (!senhaApagar || apagando) return
    if (!window.confirm('Apagar sua conta e todas as suas fotos? Não dá para desfazer.')) return

    setErroApagar('')
    setApagando(true)
    try {
      const corpo = new FormData()
      corpo.append('senha', senhaApagar)
      await chamarApi('/perfil', 'DELETE', corpo)
      esquecerSessao()
      navegar('/login', { replace: true, state: { contaApagada: true } })
    } catch (problema) {
      setErroApagar(problema.message)
      setApagando(false)
    }
  }

  if (!pessoa) return null

  return (
    <form className="config" onSubmit={salvar}>
      <div className="titulo-pagina">
        <div>
          <h1>Configurações</h1>
        </div>
      </div>

      <section className="caixa config-secao config-perfil" aria-label="Perfil público">

        <div className="config-imagens">
          <div className="config-banner">
            <img src={previaBanner || urlFoto(pessoa.banner)} alt="Seu banner" />
            <button type="button" className="pill config-trocar-banner" onClick={() => seletorBanner.current.click()}>
              <Camera size={17} /> Trocar banner
            </button>
          </div>

          <div className="config-avatar">
            <span className="avatar avatar-gg">
              <img src={previaFoto || urlFoto(pessoa.foto)} alt="Sua foto de perfil" />
            </span>
            <button
              type="button"
              className="config-trocar-foto"
              onClick={() => seletorFoto.current.click()}
              aria-label="Trocar foto de perfil"
            >
              <Camera size={16} />
            </button>
          </div>

          <input
            ref={seletorBanner}
            type="file"
            accept={IMAGENS_ACEITAS}
            className="so-leitor"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(evento) => escolherBanner(evento.target.files[0])}
          />
          <input
            ref={seletorFoto}
            type="file"
            accept={IMAGENS_ACEITAS}
            className="so-leitor"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(evento) => escolherFoto(evento.target.files[0])}
          />
        </div>

        {(novaFoto || novoBanner) && (
          <p className="dica">
            <strong>As imagens novas são enviadas quando você salvar.</strong>
          </p>
        )}

        <div className="config-campo">
          <label className="rotulo" htmlFor="configNome">Nome</label>
          <input
            id="configNome"
            className="campo"
            type="text"
            maxLength={60}
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            aria-invalid={nome.trim() === ''}
          />
          {nome.trim() === '' && <p className="config-erro-campo">O nome não pode ficar vazio.</p>}
        </div>

        <div className="config-campo">
          <label className="rotulo" htmlFor="configBio">Bio</label>
          <textarea
            id="configBio"
            className="campo"
            rows="3"
            maxLength={LIMITE_BIO}
            value={bio}
            onChange={(evento) => setBio(evento.target.value)}
          />
          <span className="contador">
            {bio.length}/{LIMITE_BIO}
          </span>
        </div>
      </section>

      <section className="caixa config-secao" aria-labelledby="tituloConta">
        <h2 className="caixa-titulo" id="tituloConta">Conta</h2>

        <div className="config-campo">
          <label className="rotulo" htmlFor="configUsuario">Usuário</label>
          <div className={usuarioValido ? 'campo-com-icone' : 'campo-com-icone config-invalido'}>
            <AtSign size={18} className="campo-icone" aria-hidden="true" />
            <input
              id="configUsuario"
              className="campo config-usuario"
              type="text"
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="dicaUsuario estadoUsuario"
              aria-invalid={!usuarioValido}
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value.toLowerCase().replace(/^@/, '').trim())}
            />
            <span id="estadoUsuario" className={usuarioValido ? 'config-estado ok' : 'config-estado erro'}>
              {usuarioValido ? <Check size={16} /> : <CircleAlert size={16} />}
              {usuarioValido ? 'Formato válido' : 'Formato inválido'}
            </span>
          </div>
          <p className="dica" id="dicaUsuario">
            3 a 20 caracteres: letras minúsculas, números, ponto ou sublinhado.
          </p>
        </div>

        {usuarioMudou && usuarioValido && (
          <p className="recado">
            <UserRound size={18} />
            <span>
              Depois de salvar, você vai entrar com <strong>@{usuario}</strong> (antes era @{pessoa.usuario}).
            </span>
          </p>
        )}
      </section>

      <section className="caixa config-secao config-sessao" aria-labelledby="tituloSessao">
        <div>
          <h2 className="caixa-titulo" id="tituloSessao">Sessão</h2>
        </div>
        <button type="button" className="pill pill-perigo config-sair" onClick={sair}>
          <LogOut size={18} /> Sair da conta
        </button>
      </section>

      <section className="caixa config-secao config-apagar" aria-labelledby="tituloApagar">
        <h2 className="caixa-titulo" id="tituloApagar">Apagar conta</h2>
        <p className="config-apagar-texto">
          Apaga sua conta, suas fotos, curtidas e salvos. Não dá para desfazer.
        </p>
        <div className="config-apagar-linha">
          <div className="config-campo">
            <label className="rotulo" htmlFor="configSenhaApagar">Confirme com a sua senha</label>
            <input
              id="configSenhaApagar"
              type="password"
              className="campo"
              autoComplete="current-password"
              value={senhaApagar}
              onChange={(evento) => setSenhaApagar(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') {
                  evento.preventDefault()
                  apagarConta()
                }
              }}
            />
          </div>
          <button
            type="button"
            className="pill pill-perigo config-sair"
            onClick={apagarConta}
            disabled={!senhaApagar || apagando}
          >
            <Trash2 size={18} /> {apagando ? 'Apagando...' : 'Apagar conta'}
          </button>
        </div>
        {erroApagar && (
          <p className="aviso aviso-erro" role="alert">
            <TriangleAlert size={18} /> {erroApagar}
          </p>
        )}
      </section>

      {erro && (
        <p className="aviso aviso-erro" role="alert">
          <TriangleAlert size={18} /> {erro}
        </p>
      )}

      <div className="config-salvar">
        <button type="submit" className="botao" disabled={!podeSalvar}>
          <Check size={19} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {toast}
    </form>
  )
}

export default Configuracoes
