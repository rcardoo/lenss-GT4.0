import { createClient } from '@libsql/client'
import { pathToFileURL } from 'node:url'
import { CAMINHO_BANCO } from './armazenamento.js'

const banco = createClient(
  process.env.TURSO_DATABASE_URL
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: pathToFileURL(CAMINHO_BANCO).href },
)

function comoObjetos(resultado) {
  return resultado.rows.map((linha) =>
    Object.fromEntries(resultado.columns.map((coluna, i) => [coluna, linha[i]])),
  )
}

export async function todos(sql, valores = []) {
  return comoObjetos(await banco.execute({ sql, args: valores }))
}

export async function um(sql, valores = []) {
  return (await todos(sql, valores))[0]
}

export async function rodar(sql, valores = []) {
  const resultado = await banco.execute({ sql, args: valores })
  return {
    changes: resultado.rowsAffected,
    lastInsertRowid: resultado.lastInsertRowid === undefined ? undefined : Number(resultado.lastInsertRowid),
  }
}

export async function emLote(comandos) {
  const resultados = await banco.batch(
    comandos.map(([sql, valores = []]) => ({ sql, args: valores })),
    'write',
  )
  return resultados.map(comoObjetos)
}

async function prepararTabelas() {
  await banco.executeMultiple(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      senha   TEXT NOT NULL,
      nome    TEXT NOT NULL DEFAULT '',
      bio     TEXT NOT NULL DEFAULT '',
      foto    TEXT NOT NULL DEFAULT 'sem-foto.svg',
      banner  TEXT NOT NULL DEFAULT 'sem-banner.svg'
    );

    CREATE TABLE IF NOT EXISTS posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      imagem     TEXT NOT NULL,
      legenda    TEXT NOT NULL DEFAULT ''
    );
  `)

  const colunas = await todos('PRAGMA table_info(usuarios)')
  if (!colunas.some((coluna) => coluna.name === 'banner')) {
    await banco.execute("ALTER TABLE usuarios ADD COLUMN banner TEXT NOT NULL DEFAULT 'sem-banner.svg'")
  }

  const colunasPosts = await todos('PRAGMA table_info(posts)')
  if (!colunasPosts.some((coluna) => coluna.name === 'ajuste')) {
    await banco.execute("ALTER TABLE posts ADD COLUMN ajuste TEXT NOT NULL DEFAULT 'preencher'")
  }

  await banco.executeMultiple(`
    CREATE TABLE IF NOT EXISTS curtidas (
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      post_id    INTEGER NOT NULL REFERENCES posts(id),
      PRIMARY KEY (usuario_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS salvos (
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      post_id    INTEGER NOT NULL REFERENCES posts(id),
      PRIMARY KEY (usuario_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS seguidores (
      seguidor_id INTEGER NOT NULL REFERENCES usuarios(id),
      seguido_id  INTEGER NOT NULL REFERENCES usuarios(id),
      PRIMARY KEY (seguidor_id, seguido_id)
    );

    CREATE TABLE IF NOT EXISTS tentativas (
      chave   TEXT NOT NULL,
      momento INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS tentativas_por_chave ON tentativas (chave, momento);

    CREATE TABLE IF NOT EXISTS sessoes (
      id         TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      expira     INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sessoes_por_usuario ON sessoes (usuario_id);
  `)
}

await prepararTabelas()

export default banco
