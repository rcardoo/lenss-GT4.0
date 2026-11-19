import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Plus, Maximize2, Trash2, TriangleAlert } from 'lucide-react'
import { chamarApi, urlFoto, LIMITE_FOTOS } from '../api.js'
import CabecalhoPerfil from '../components/CabecalhoPerfil.jsx'
import MenuOpcoes from '../components/MenuOpcoes.jsx'
import TelaCheia from '../components/TelaCheia.jsx'
import { useToast } from '../components/Toast.jsx'
import { useUsuario } from '../components/UsuarioContexto.jsx'
import './Perfil.css'

function Perfil() {
  const { pessoa, erro: erroAoCarregar, recarregar } = useUsuario()
  const [erro, setErro] = useState('')
  const [fotoAberta, setFotoAberta] = useState(null)
  const [toast, mostrarToast] = useToast()

  async function apagar(post) {
    if (!window.confirm('Apagar esta foto? Não dá para desfazer.')) return

    try {
      await chamarApi(`/posts/${post.id}`, 'DELETE')
      await recarregar()
      mostrarToast('Foto apagada')
    } catch (problema) {
      setErro(problema.message)
    }
  }

  const mensagemDeErro = erro || erroAoCarregar

  return (
    <>
      {mensagemDeErro && (
        <p className="aviso aviso-erro" role="alert">
          <TriangleAlert size={18} /> {mensagemDeErro}
        </p>
      )}

      {pessoa && (
        <>
          <CabecalhoPerfil
            usuario={pessoa.usuario}
            nome={pessoa.nome}
            bio={pessoa.bio}
            foto={pessoa.foto}
            banner={pessoa.banner}
            publicacoes={pessoa.posts.length}
            seguidores={pessoa.seguidores}
            seguindo={pessoa.seguindo}
          />

          <section aria-labelledby="tituloPublicacoes">
            <div className="publicacoes-topo">
              <h2 id="tituloPublicacoes">
                <LayoutGrid size={22} /> Publicações
              </h2>
              <span className="publicacoes-limite">
                {pessoa.posts.length} de {LIMITE_FOTOS} fotos
              </span>
            </div>

            <div className="grade">
              {pessoa.posts.map((post) => (
                <div className={`grade-item grade-${post.ajuste}`} key={post.id}>
                  <button
                    type="button"
                    className="grade-abrir"
                    onClick={() => setFotoAberta(post)}
                    aria-label={`Ver em tela cheia: ${post.legenda || 'foto sem legenda'}`}
                  >
                    <img src={urlFoto(post.imagem)} alt={post.legenda} />
                  </button>

                  {post.legenda && <p className="grade-legenda">{post.legenda}</p>}

                  <MenuOpcoes
                    className="grade-opcoes"
                    rotulo="Opções da foto"
                    opcoes={[
                      { texto: 'Ver em tela cheia', icone: Maximize2, aoClicar: () => setFotoAberta(post) },
                      { texto: 'Apagar foto', icone: Trash2, aoClicar: () => apagar(post), perigo: true },
                    ]}
                  />
                </div>
              ))}

              {pessoa.posts.length < LIMITE_FOTOS && (
                <Link to="/novo" className="grade-item grade-nova">
                  <span className="redondo" aria-hidden="true">
                    <Plus size={22} />
                  </span>
                  Nova foto
                </Link>
              )}
            </div>
          </section>
        </>
      )}

      <TelaCheia post={fotoAberta} aoFechar={() => setFotoAberta(null)} />
      {toast}
    </>
  )
}

export default Perfil
