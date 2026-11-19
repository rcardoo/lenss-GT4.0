import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Bookmark, Send, Maximize2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { BiCarousel } from 'react-icons/bi'
import Carousel from 'bootstrap/js/dist/carousel.js'
import { chamarApi, urlFoto } from '../api.js'
import Avatar from './Avatar.jsx'
import MenuOpcoes from './MenuOpcoes.jsx'
import './Post.css'

export function CartaoPost({ post, previa, etiqueta, acoes, children, foto, legenda }) {
  const ajuste = post.ajuste === 'inteira' ? 'post-foto-inteira' : 'post-foto-preencher'
  const textoLegenda = legenda !== undefined ? legenda : post.legenda

  return (
    <article className="caixa post">
      <header className="post-autor">
        {previa ? (
          <>
            <Avatar foto={post.fotoAutor} alt="" />
            <div className="post-nomes">
              <strong>{post.nomeAutor}</strong>
              <span>@{post.autor}</span>
            </div>
          </>
        ) : (
          <Link
            to={`/perfil/${encodeURIComponent(post.autor)}`}
            className="post-autor-link"
            aria-label={`Ver o perfil de ${post.nomeAutor} (@${post.autor})`}
          >
            <Avatar foto={post.fotoAutor} alt="" />
            <div className="post-nomes">
              <strong>{post.nomeAutor}</strong>
              <span>@{post.autor}</span>
            </div>
          </Link>
        )}
        {etiqueta}
      </header>

      <div className={`post-moldura ${ajuste}`}>
        {foto ||
          (post.imagem && (
            <img className="post-foto" src={post.imagemLocal || urlFoto(post.imagem)} alt={post.legenda || 'Foto'} />
          ))}
        {children}
      </div>

      {(textoLegenda || previa) && (
        <p className="post-legenda">
          <strong>{post.autor}</strong> {textoLegenda}
        </p>
      )}

      {!previa && acoes}
    </article>
  )
}

function CarrosselDoPost({ fotos, autor, aoMudar, aoFechar }) {
  const carrossel = useRef(null)
  const [atual, setAtual] = useState(0)
  const quaisFotos = fotos.map((foto) => foto.id).join(',')

  useEffect(() => {
    const elemento = carrossel.current
    const instancia = Carousel.getOrCreateInstance(elemento, { ends: 'stop' })

    const itens = [...elemento.querySelectorAll('.carousel-item')]
    const vigia = new MutationObserver(() => {
      const posicao = itens.findIndex((item) => item.classList.contains('active'))
      if (posicao >= 0) {
        setAtual(posicao)
        aoMudar(posicao)
      }
    })
    itens.forEach((item) => vigia.observe(item, { attributes: true, attributeFilter: ['class'] }))

    return () => {
      vigia.disconnect()
      instancia.dispose()
    }
  }, [quaisFotos, aoMudar])

  function irPara(posicao) {
    Carousel.getInstance(carrossel.current)?.to(posicao)
  }

  return (
    <div
      ref={carrossel}
      className="carousel slide post-carrossel swiper-no-swiping"
      data-bs-ends="stop"
    >
      <div className="carousel-inner">
        {fotos.map((foto, posicao) => (
          <div className={posicao === 0 ? 'carousel-item active' : 'carousel-item'} key={foto.id}>
            <img
              src={urlFoto(foto.imagem)}
              className={`d-block w-100 post-carrossel-foto post-carrossel-${foto.ajuste}`}
              alt={foto.legenda || `Foto de @${autor}`}
            />
          </div>
        ))}
      </div>

      {atual > 0 && (
        <button
          type="button"
          className="redondo post-carrossel-seta seta-esquerda"
          onClick={() => irPara(atual - 1)}
          aria-label="Foto anterior"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {atual < fotos.length - 1 && (
        <button
          type="button"
          className="redondo post-carrossel-seta seta-direita"
          onClick={() => irPara(atual + 1)}
          aria-label="Próxima foto"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div className="post-carrossel-etiqueta">
        <BiCarousel size={16} aria-hidden="true" />
        <span className="post-carrossel-etiqueta-texto">
          {atual === 0 ? (
            'Este post'
          ) : (
            <>
              <span className="etiqueta-longa">Fotos do perfil de </span>
              <span className="etiqueta-curta">Perfil de </span>
              <strong>@{autor}</strong>
            </>
          )}
        </span>
        <span className="post-carrossel-etiqueta-conta">
          {atual + 1} de {fotos.length}
        </span>
        <button type="button" onClick={aoFechar} aria-label="Fechar as fotos do perfil e voltar para o post" title="Voltar para o post">
          <X size={15} />
        </button>
      </div>

      <div className="post-carrossel-bolinhas">
        {fotos.map((foto, posicao) => (
          <button
            key={foto.id}
            type="button"
            className={posicao === atual ? 'ativa' : ''}
            onClick={() => irPara(posicao)}
            aria-label={`Foto ${posicao + 1} de ${fotos.length}`}
            aria-current={posicao === atual}
          />
        ))}
      </div>
    </div>
  )
}

function Post({ post, aoCurtir, aoSalvar, aoCompartilhar, aoTelaCheia, aoApagar }) {
  const [outras, setOutras] = useState(null)
  const [atual, setAtual] = useState(0)
  const [buscando, setBuscando] = useState(false)

  async function alternarCarrossel() {
    if (outras) {
      setOutras(null)
      setAtual(0)
      return
    }

    setBuscando(true)
    try {
      const dados = await chamarApi(`/usuarios/${encodeURIComponent(post.autor)}/posts`)
      setOutras(
        dados.posts.filter((foto) => foto.id !== post.id).map((foto) => ({ ...foto, autor: post.autor })),
      )
      setAtual(0)
    } catch {
      setOutras(null)
    }
    setBuscando(false)
  }

  const fotos = outras ? [post, ...outras] : null
  const fotoDaVez = fotos ? fotos[atual] : post
  const ehOPost = fotoDaVez.id === post.id

  function atualizarOutra(id, mudancas) {
    setOutras((lista) => lista.map((foto) => (foto.id === id ? { ...foto, ...mudancas } : foto)))
  }

  async function curtir() {
    if (ehOPost) {
      aoCurtir(post)
      return
    }

    const foto = fotoDaVez
    const curtir = !foto.curti
    atualizarOutra(foto.id, { curti: curtir, curtidas: foto.curtidas + (curtir ? 1 : -1) })
    try {
      const dados = await chamarApi(`/posts/${foto.id}/curtida`, curtir ? 'POST' : 'DELETE')
      atualizarOutra(foto.id, dados)
    } catch {
      atualizarOutra(foto.id, { curti: foto.curti, curtidas: foto.curtidas })
    }
  }

  async function salvar() {
    if (ehOPost) {
      aoSalvar(post)
      return
    }

    const foto = fotoDaVez
    const salvar = !foto.salvei
    atualizarOutra(foto.id, { salvei: salvar })
    try {
      await chamarApi(`/posts/${foto.id}/salvo`, salvar ? 'POST' : 'DELETE')
    } catch {
      atualizarOutra(foto.id, { salvei: foto.salvei })
    }
  }

  const opcoes = [{ texto: 'Ver em tela cheia', icone: Maximize2, aoClicar: () => aoTelaCheia(fotoDaVez) }]
  if (post.meu && ehOPost) {
    opcoes.push({ texto: 'Apagar foto', icone: Trash2, aoClicar: () => aoApagar(post), perigo: true })
  }

  const acoes = (
    <div className="post-acoes">
      <button
        type="button"
        className={fotoDaVez.curti ? 'redondo post-acao post-curtido' : 'redondo post-acao'}
        onClick={curtir}
        aria-pressed={fotoDaVez.curti}
        aria-label={fotoDaVez.curti ? 'Descurtir' : 'Curtir'}
      >
        <Heart size={20} fill={fotoDaVez.curti ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        className={fotoDaVez.salvei ? 'redondo post-acao post-salvo' : 'redondo post-acao'}
        onClick={salvar}
        aria-pressed={fotoDaVez.salvei}
        aria-label={fotoDaVez.salvei ? 'Tirar dos salvos' : 'Salvar'}
      >
        <Bookmark size={20} fill={fotoDaVez.salvei ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        className="redondo post-acao"
        onClick={() => aoCompartilhar(fotoDaVez)}
        aria-label="Compartilhar"
      >
        <Send size={20} />
      </button>
      <button
        type="button"
        className={outras ? 'redondo post-acao post-carrossel-ligado' : 'redondo post-acao'}
        onClick={alternarCarrossel}
        disabled={buscando}
        aria-pressed={!!outras}
        aria-label={outras ? 'Voltar para esta foto' : `Ver todas as fotos de @${post.autor}`}
        title={outras ? 'Voltar para esta foto' : `Todas as fotos de @${post.autor}`}
      >
        <BiCarousel size={21} />
      </button>

      {fotoDaVez.curtidas > 0 && (
        <span className="post-curtidas">
          {fotoDaVez.curtidas} {fotoDaVez.curtidas === 1 ? 'curtida' : 'curtidas'}
        </span>
      )}
    </div>
  )

  return (
    <CartaoPost
      post={post}
      acoes={acoes}
      legenda={fotoDaVez.legenda}
      foto={fotos && <CarrosselDoPost fotos={fotos} autor={post.autor} aoMudar={setAtual} aoFechar={alternarCarrossel} />}
      etiqueta={<MenuOpcoes opcoes={opcoes} rotulo={`Opções da foto de ${post.autor}`} className="post-opcoes" />}
    />
  )
}

export default Post
