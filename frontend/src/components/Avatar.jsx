import { urlFoto } from '../api.js'

function Avatar({ foto, tamanho = 'm', alt = 'Foto de perfil' }) {
  return (
    <span className={`avatar avatar-${tamanho}`}>
      <img src={urlFoto(foto)} alt={alt} />
    </span>
  )
}

export default Avatar
