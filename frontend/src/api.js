export const URL_API = '/api'

export const CABECALHOS = { 'X-LENSS': '1' }

const MARCA_SESSAO = 'sessaoExpira'

export const LIMITE_FOTOS = 3

export function urlFoto(nome) {
  if (/^https?:\/\//.test(nome)) return nome
  return `${URL_API}/uploads/${nome}`
}

export function guardarSessao(expira) {
  try {
    localStorage.setItem(MARCA_SESSAO, String(expira))
  } catch {
    return
  }
}

export function esquecerSessao() {
  try {
    localStorage.removeItem(MARCA_SESSAO)
    localStorage.removeItem('token')
  } catch {
    return
  }
}

export function estadoDaSessao() {
  let expira
  try {
    localStorage.removeItem('token')
    expira = Number(localStorage.getItem(MARCA_SESSAO))
  } catch {
    return 'sem'
  }
  if (!expira) return 'sem'
  if (expira > Date.now()) return 'ok'

  esquecerSessao()
  return 'expirou'
}

export async function sairDaConta() {
  try {
    await fetch(`${URL_API}/sair`, { method: 'POST', headers: CABECALHOS })
  } finally {
    esquecerSessao()
  }
}

export function destinoSeguro(caminho) {
  if (typeof caminho !== 'string' || !caminho.startsWith('/') || caminho.startsWith('//')) return '/'
  if (caminho.startsWith('/login') || caminho.startsWith('/cadastro')) return '/'
  return caminho
}

export const IMAGENS_ACEITAS = 'image/jpeg,image/png,image/webp,image/gif'
const TAMANHO_MAXIMO_MB = 4

export function problemaNaImagem(arquivo) {
  if (!IMAGENS_ACEITAS.split(',').includes(arquivo.type)) {
    return 'Envie uma imagem JPG, PNG, WebP ou GIF.'
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `A imagem pode ter até ${TAMANHO_MAXIMO_MB} MB.`
  }
  return ''
}

export async function chamarApi(caminho, metodo = 'GET', corpo) {
  let resposta
  try {
    resposta = await fetch(URL_API + caminho, {
      method: metodo,
      headers: CABECALHOS,
      body: corpo,
    })
  } catch {
    throw new Error('Não consegui falar com o servidor. Ele está ligado?')
  }

  if (resposta.status === 401) {
    esquecerSessao()
    const aqui = window.location.pathname + window.location.search
    window.location.href = `/login?expirou=1&de=${encodeURIComponent(aqui)}`
    throw new Error('Sua sessão expirou. Entre de novo.')
  }

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(dados.erro)
  }

  return dados
}
