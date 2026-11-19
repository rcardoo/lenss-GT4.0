import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Images, TriangleAlert } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Keyboard, A11y } from 'swiper/modules'
import 'swiper/css'
import { chamarApi, urlFoto } from '../api.js'
import Post from '../components/Post.jsx'
import TelaCheia from '../components/TelaCheia.jsx'
import { useToast } from '../components/Toast.jsx'
import { useUsuario } from '../components/UsuarioContexto.jsx'
import './Feed.css'

function Feed() {
  const [posts, setPosts] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [fotoAberta, setFotoAberta] = useState(null)
  const [toast, mostrarToast] = useToast()
  const { recarregar } = useUsuario()
  const swiper = useRef(null)

  async function carregarFeed() {
    setCarregando(true)
    try {
      const dados = await chamarApi('/feed')
      setPosts(dados)
      setErro('')
      if (swiper.current && !swiper.current.destroyed) swiper.current.slideTo(0, 0)
      window.scrollTo({ top: 0 })
    } catch (problema) {
      setErro(problema.message)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarFeed()
  }, [])

  function atualizarPost(id, mudancas) {
    setPosts((lista) => lista.map((post) => (post.id === id ? { ...post, ...mudancas } : post)))
  }

  async function curtir(post) {
    const curtir = !post.curti
    atualizarPost(post.id, { curti: curtir, curtidas: post.curtidas + (curtir ? 1 : -1) })

    try {
      const dados = await chamarApi(`/posts/${post.id}/curtida`, curtir ? 'POST' : 'DELETE')
      atualizarPost(post.id, dados)
    } catch (problema) {
      atualizarPost(post.id, { curti: post.curti, curtidas: post.curtidas })
      setErro(problema.message)
    }
  }

  async function salvar(post) {
    const salvar = !post.salvei
    atualizarPost(post.id, { salvei: salvar })

    try {
      await chamarApi(`/posts/${post.id}/salvo`, salvar ? 'POST' : 'DELETE')
      mostrarToast(salvar ? 'Foto salva' : 'Foto tirada dos salvos')
    } catch (problema) {
      atualizarPost(post.id, { salvei: post.salvei })
      setErro(problema.message)
    }
  }

  async function compartilhar(post) {
    const link = urlFoto(post.imagem)

    if (navigator.share) {
      try {
        await navigator.share({ title: `Foto de @${post.autor} no LENSS`, text: post.legenda, url: link })
      } catch {
      }
      return
    }

    try {
      await navigator.clipboard.writeText(link)
      mostrarToast('Link da foto copiado')
    } catch {
      setErro('Não consegui copiar o link.')
    }
  }

  async function apagar(post) {
    if (!window.confirm('Apagar esta foto? Não dá para desfazer.')) return

    try {
      await chamarApi(`/posts/${post.id}`, 'DELETE')
      setPosts((lista) => lista.filter((item) => item.id !== post.id))
      recarregar()
      mostrarToast('Foto apagada')
    } catch (problema) {
      setErro(problema.message)
    }
  }

  function cartao(post) {
    return (
      <Post
        key={post.id}
        post={post}
        aoCurtir={curtir}
        aoSalvar={salvar}
        aoCompartilhar={compartilhar}
        aoTelaCheia={setFotoAberta}
        aoApagar={apagar}
      />
    )
  }

  const fimDaMistura = (
    <div className="feed-novas">
      <button type="button" className="botao" onClick={carregarFeed}>
        <RefreshCw size={18} /> Novas Pics
      </button>
    </div>
  )

  return (
    <div className="feed">
      <h1 className="so-leitor">Feed</h1>

      {erro && (
        <p className="aviso aviso-erro" role="alert">
          <TriangleAlert size={18} /> {erro}
        </p>
      )}

      {carregando && posts.length === 0 && <p className="feed-carregando">Carregando fotos...</p>}

      {!carregando && !erro && posts.length === 0 && (
        <div className="caixa feed-fim">
          <Images size={30} />
          <p>Ainda não há fotos por aqui.</p>
          <button type="button" className="pill" onClick={carregarFeed}>
            <RefreshCw size={16} /> Nova mistura
          </button>
        </div>
      )}

      {posts.length > 0 && (
        <Swiper
          className="feed-reels"
          direction="vertical"
          slidesPerView={1}
          spaceBetween={20}
          longSwipesRatio={0.2}
          modules={[Mousewheel, Keyboard, A11y]}
          mousewheel={{ forceToAxis: true, thresholdDelta: 20 }}
          keyboard={{ enabled: true }}
          a11y={{
            prevSlideMessage: 'Foto anterior',
            nextSlideMessage: 'Próxima foto',
            slideLabelMessage: 'Foto {{index}} de {{slidesLength}}',
          }}
          onSwiper={(instancia) => {
            swiper.current = instancia
          }}
        >
          {posts.map((post) => (
            <SwiperSlide key={post.id}>
              {cartao(post)}
            </SwiperSlide>
          ))}

          <SwiperSlide>
            {fimDaMistura}
          </SwiperSlide>
        </Swiper>
      )}

      <TelaCheia post={fotoAberta} aoFechar={() => setFotoAberta(null)} />
      {toast}
    </div>
  )
}

export default Feed
