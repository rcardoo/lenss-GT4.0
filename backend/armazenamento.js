import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PASTA_DO_CODIGO = path.dirname(fileURLToPath(import.meta.url))

const PASTA_DADOS = process.env.DADOS_DIR ? path.resolve(process.env.DADOS_DIR) : PASTA_DO_CODIGO
export const CAMINHO_BANCO = path.join(PASTA_DADOS, 'banco.db')
export const PASTA_UPLOADS = path.join(PASTA_DADOS, 'uploads')

const USAR_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

try {
  mkdirSync(PASTA_UPLOADS, { recursive: true })
} catch {}

const ARQUIVO_ENVIADO = /^\d+-\d+\.(jpg|png|webp|gif)$/

export async function apagarImagem(nome) {
  if (!nome) return
  try {
    if (/^https?:\/\//.test(nome)) {
      if (USAR_BLOB && nome.includes('.blob.vercel-storage.com/')) {
        const { del } = await import('@vercel/blob')
        await del(nome)
      }
      return
    }
    if (ARQUIVO_ENVIADO.test(nome)) {
      unlinkSync(path.join(PASTA_UPLOADS, nome))
    }
  } catch (erro) {
    console.error('Não consegui apagar a imagem antiga:', nome, erro.message)
  }
}

export async function salvarImagem(arquivo, extensao) {
  const sorteio = Math.round(Math.random() * 1e6)
  const nome = `${Date.now()}-${sorteio}${extensao}`

  if (USAR_BLOB) {
    const { put } = await import('@vercel/blob')
    const resultado = await put(`lenss/${nome}`, arquivo.buffer, {
      access: 'public',
      contentType: arquivo.mimetype,
    })
    return resultado.url
  }

  writeFileSync(path.join(PASTA_UPLOADS, nome), arquivo.buffer)
  return nome
}
