import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, X, Eye, ImagePlus, Image, Trash2, Maximize2, RectangleVertical, Upload, TriangleAlert,
} from 'lucide-react'
import { chamarApi, IMAGENS_ACEITAS, problemaNaImagem, LIMITE_FOTOS } from '../api.js'
import { CartaoPost } from '../components/Post.jsx'
import { useUsuario } from '../components/UsuarioContexto.jsx'
import './NovoPic.css'

const LIMITE_LEGENDA = 200

function NovoPic() {
  const { pessoa, recarregar } = useUsuario()
  const navegar = useNavigate()
  const seletor = useRef(null)

  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState('')
  const [ajuste, setAjuste] = useState('preencher')
  const [legenda, setLegenda] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa)
    }
  }, [previa])

  function escolherArquivo(novo) {
    if (!novo) return
    const problema = problemaNaImagem(novo)
    if (problema) {
      setErro(problema)
      return
    }
    setErro('')
    setArquivo(novo)
    setPrevia(URL.createObjectURL(novo))
  }

  function abrirSeletor() {
    seletor.current.click()
  }

  function remover() {
    setArquivo(null)
    setPrevia('')
    seletor.current.value = ''
  }

  function soltar(evento) {
    evento.preventDefault()
    setArrastando(false)
    escolherArquivo(evento.dataTransfer.files[0])
  }

  async function publicar(evento) {
    evento.preventDefault()
    if (!arquivo) return

    const pacote = new FormData()
    pacote.append('imagem', arquivo)
    pacote.append('legenda', legenda.trim())
    pacote.append('ajuste', ajuste)

    setEnviando(true)
    setErro('')
    try {
      await chamarApi('/posts', 'POST', pacote)
      await recarregar()
      navegar('/perfil')
    } catch (problema) {
      setErro(problema.message)
      setEnviando(false)
    }
  }

  function cancelar() {
    navegar(-1)
  }

  const noLimite = Boolean(pessoa) && pessoa.posts.length >= LIMITE_FOTOS

  const postPrevia = {
    nomeAutor: pessoa?.nome,
    autor: pessoa?.usuario,
    fotoAutor: pessoa?.foto || 'sem-foto.svg',
    imagem: arquivo ? 'previa' : null,
    imagemLocal: previa,
    legenda: legenda,
    ajuste: ajuste,
  }

  return (
    <form className="novo" onSubmit={publicar}>
      <div className="novo-topo-celular">
        <button type="button" className="redondo" onClick={cancelar} aria-label="Fechar">
          <X size={22} />
        </button>
        <h1>Novo Pic</h1>
        <span aria-hidden="true"></span>
      </div>

      <div className="novo-topo">
        <div>
          <Link to="/" className="novo-voltar">
            <ArrowLeft size={18} /> Voltar ao feed
          </Link>
          <h1>Novo Pic</h1>
        </div>
      </div>

      {noLimite && (
        <p className="aviso aviso-erro novo-limite" role="alert">
          <TriangleAlert size={18} />
          <span>
            Você já tem {LIMITE_FOTOS} fotos, o limite de cada perfil. <Link to="/perfil">Apague uma no seu perfil</Link>{' '}
            para postar outra.
          </span>
        </p>
      )}

      <input
        ref={seletor}
        type="file"
        accept={IMAGENS_ACEITAS}
        className="so-leitor"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(evento) => escolherArquivo(evento.target.files[0])}
      />

      <div className="novo-grade">
        <section className="caixa novo-palco" aria-label="Prévia no feed">
          <div
            className={arrastando ? 'novo-previa arrastando' : 'novo-previa'}
            onDragOver={(evento) => {
              evento.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={soltar}
          >
            <CartaoPost
              post={postPrevia}
              previa
              etiqueta={
                <span className="novo-etiqueta">
                  <Eye size={16} /> Prévia no feed
                </span>
              }
            >
              {arquivo ? (
                <button type="button" className="redondo novo-trocar-celular" onClick={abrirSeletor} aria-label="Trocar foto">
                  <Image size={20} />
                </button>
              ) : (
                <button type="button" className="novo-vazio" onClick={abrirSeletor}>
                  <span className="redondo" aria-hidden="true">
                    <ImagePlus size={24} />
                  </span>
                  <strong>Escolher foto</strong>
                  <span>ou arraste uma imagem para cá</span>
                </button>
              )}
            </CartaoPost>
          </div>

          {arquivo && (
            <div className="novo-controles">
              <div className="novo-segmento" role="radiogroup" aria-label="Enquadramento">
                <button
                  type="button"
                  role="radio"
                  aria-checked={ajuste === 'preencher'}
                  className={ajuste === 'preencher' ? 'ativo' : ''}
                  onClick={() => setAjuste('preencher')}
                >
                  <Maximize2 size={17} /> Preencher
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={ajuste === 'inteira'}
                  className={ajuste === 'inteira' ? 'ativo' : ''}
                  onClick={() => setAjuste('inteira')}
                >
                  <RectangleVertical size={17} /> Foto inteira
                </button>
              </div>

              <button type="button" className="pill novo-so-computador" onClick={abrirSeletor}>
                <Image size={17} /> Trocar foto
              </button>
              <button type="button" className="pill novo-so-computador" onClick={remover}>
                <Trash2 size={17} /> Remover
              </button>
            </div>
          )}
        </section>

        <div className="novo-lado">
          <section className="caixa novo-legenda">
            <div className="novo-legenda-topo">
              <label className="rotulo" htmlFor="novoLegenda">Legenda</label>
              <span className="contador novo-so-celular">
                {legenda.length}/{LIMITE_LEGENDA}
              </span>
            </div>
            <textarea
              id="novoLegenda"
              className="campo"
              rows="5"
              maxLength={LIMITE_LEGENDA}
              placeholder="Conte algo sobre essa foto..."
              value={legenda}
              onChange={(evento) => setLegenda(evento.target.value)}
            />
            <div className="novo-legenda-rodape novo-so-computador">
              <span>
                {legenda.length}/{LIMITE_LEGENDA}
              </span>
            </div>
          </section>

          {erro && (
            <p className="aviso aviso-erro" role="alert">
              <TriangleAlert size={18} /> {erro}
            </p>
          )}

          <div className="novo-botoes">
            <button type="button" className="pill novo-cancelar novo-so-computador" onClick={cancelar}>
              Cancelar
            </button>
            <button type="submit" className="botao novo-publicar" disabled={!arquivo || enviando || noLimite}>
              <Upload size={19} /> {enviando ? 'Publicando...' : 'Publicar Pic'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default NovoPic
