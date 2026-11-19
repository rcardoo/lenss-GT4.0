import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { urlFoto } from '../api.js'
import './TelaCheia.css'

function TelaCheia({ post, aoFechar }) {
  const janela = useRef(null)

  useEffect(() => {
    if (post && !janela.current.open) janela.current.showModal()
    if (!post && janela.current.open) janela.current.close()
  }, [post])

  function cliqueNoFundo(evento) {
    if (evento.target === janela.current) aoFechar()
  }

  return (
    <dialog ref={janela} className="tela-cheia" onClose={aoFechar} onClick={cliqueNoFundo} aria-label="Foto em tela cheia">
      {post && (
        <figure className="tela-cheia-figura">
          <img src={urlFoto(post.imagem)} alt={post.legenda || 'Foto'} />
          {post.legenda && <figcaption>{post.legenda}</figcaption>}
        </figure>
      )}
      <button type="button" className="redondo tela-cheia-fechar" onClick={aoFechar} aria-label="Fechar">
        <X size={20} />
      </button>
    </dialog>
  )
}

export default TelaCheia
