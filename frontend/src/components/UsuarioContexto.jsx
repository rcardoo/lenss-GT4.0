import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { chamarApi } from '../api.js'

const Contexto = createContext(null)

export function UsuarioProvider({ children }) {
  const [pessoa, setPessoa] = useState(null)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    try {
      const dados = await chamarApi('/perfil')
      setPessoa(dados)
      setErro('')
      return dados
    } catch (problema) {
      setErro(problema.message)
      return null
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return <Contexto.Provider value={{ pessoa, erro, recarregar }}>{children}</Contexto.Provider>
}

export function useUsuario() {
  return useContext(Contexto)
}
