import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { LayoutGrid, TriangleAlert } from 'lucide-react'
import { chamarApi, urlFoto } from '../api.js'
import CabecalhoPerfil from '../components/CabecalhoPerfil.jsx'
import TelaCheia from '../components/TelaCheia.jsx'
import { useUsuario } from '../components/UsuarioContexto.jsx'
import './Perfil.css'

function PerfilPessoa() {
  const { usuario } = useParams()
  const { pessoa: eu } = useUsuario()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [fotoAberta, setFotoAberta] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  async function alternarSeguir() {
    setOcupado(true)
    setErro('')
    try {
      const resposta = await chamarApi(
        `/usuarios/${encodeURIComponent(dados.usuario)}/seguir`,
        dados.sigo ? 'DELETE' : 'POST',
      )
      setDados({ ...dados, sigo: resposta.sigo, seguidores: resposta.seguidores })
    } catch (problema) {
      setErro(problema.message)
    }
    setOcupado(false)
  }

  useEffect(() => {
    let ativo = true
    setDados(null)
    setErro('')

    chamarApi(`/usuarios/${encodeURIComponent(usuario)}/posts`)
      .then((resposta) => ativo && setDados(resposta))
      .catch((problema) => ativo && setErro(problema.message))

    return () => {
      ativo = false
    }
  }, [usuario])

  if (eu && eu.usuario === usuario) {
    return <Navigate to="/perfil" replace />
  }

  return (
    <>
      {erro && (
        <p className="aviso aviso-erro" role="alert">
          <TriangleAlert size={18} /> {erro}
        </p>
      )}

      {dados && (
        <>
          <CabecalhoPerfil
            usuario={dados.usuario}
            nome={dados.nome}
            bio={dados.bio}
            foto={dados.foto}
            banner={dados.banner}
            publicacoes={dados.posts.length}
            seguidores={dados.seguidores}
            seguindo={dados.seguindo}
            meu={false}
            sigo={dados.sigo}
            aoSeguir={alternarSeguir}
            ocupado={ocupado}
          />

          <section aria-labelledby="tituloPublicacoes">
            <div className="publicacoes-topo">
              <h2 id="tituloPublicacoes">
                <LayoutGrid size={22} /> Publicações
              </h2>
            </div>

            {dados.posts.length === 0 ? (
              <p className="publicacoes-vazio">@{dados.usuario} ainda não postou fotos.</p>
            ) : (
              <div className="grade">
                {dados.posts.map((post) => (
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <TelaCheia post={fotoAberta} aoFechar={() => setFotoAberta(null)} />
    </>
  )
}

export default PerfilPessoa
