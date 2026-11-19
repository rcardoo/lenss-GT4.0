import { randomBytes, createHash } from 'node:crypto'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { todos, um, rodar, emLote } from './banco.js'
import { PASTA_UPLOADS, salvarImagem, apagarImagem } from './armazenamento.js'

const app = express()

const MINIMO_SENHA = 8
const MAXIMO_BYTES_SENHA = 72
const LIMITE_NOME = 60

const SENHAS_COMUNS = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '12341234', '11223344',
  '10203040', '1020304050', '147258369', '123123123', 'password', 'password1', 'password123', 'senha123',
  'senha1234', 'senhasenha', 'minhasenha', 'mudar123', 'qwertyui', 'qwerty123', 'asdfghjk', 'zxcvbnm1',
  '1q2w3e4r', 'q1w2e3r4', '1qaz2wsx', 'abcd1234', 'abc12345', 'abcdefgh', 'iloveyou', 'admin123',
  'welcome1', 'letmein1', 'princesa', 'flamengo', 'corinthians', 'palmeiras', 'saopaulo', 'brasil123',
  'teste123', 'teste1234', 'lenss123', 'instagram', 'football', 'futebol1', 'gabriel1', 'mariana1',
])

const SEGREDO = process.env.JWT_SECRET
if (!SEGREDO) {
  console.error('Falta o JWT_SECRET (no backend/.env, ou nas variáveis da Vercel).')
  process.exit(1)
}

app.disable('x-powered-by')
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  })
  next()
})

const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS']
app.use((req, res, next) => {
  if (METODOS_SEGUROS.includes(req.method) || req.get('X-LENSS') === '1') return next()
  res.status(403).json({ erro: 'Pedido recusado.' })
})

const JANELA_FLOOD = 60 * 1000
const BLOQUEIO_FLOOD = 2 * 60 * 1000
const PEDIDOS_POR_REDE = 120
const PEDIDOS_POR_SESSAO = 120
const contadores = new Map()

function contar(chave, maximo, agora) {
  let registro = contadores.get(chave)
  if (registro && registro.bloqueadoAte > agora) return registro.bloqueadoAte
  if (!registro || agora - registro.inicio > JANELA_FLOOD) {
    registro = { inicio: agora, total: 0, bloqueadoAte: 0 }
    contadores.set(chave, registro)
  }
  registro.total++
  if (registro.total > maximo) {
    registro.bloqueadoAte = agora + BLOQUEIO_FLOOD
    return registro.bloqueadoAte
  }
  return 0
}

function limparContadores(agora) {
  for (const [chave, registro] of contadores) {
    if (registro.bloqueadoAte < agora && agora - registro.inicio > JANELA_FLOOD) contadores.delete(chave)
  }
}

app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/uploads/')) return next()
  const agora = Date.now()
  if (contadores.size > 10000) limparContadores(agora)
  const sid = sessaoDoCookie(req)
  const bloqueadoAte = sid
    ? contar(`sessao:${resumo(sid)}`, PEDIDOS_POR_SESSAO, agora)
    : contar(`rede:${ipDe(req)}`, PEDIDOS_POR_REDE, agora)
  if (bloqueadoAte) {
    res.set('Retry-After', String(Math.ceil((bloqueadoAte - agora) / 1000)))
    return res.status(429).json({ erro: 'Muitos pedidos seguidos. Espere 2 minutos e tente de novo.' })
  }
  next()
})
app.use(express.json({ limit: '20kb' }))
app.use('/uploads', express.static(PASTA_UPLOADS))

const TIPOS_DE_IMAGEM = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
const TAMANHO_MAXIMO_MB = 4

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO_MB * 1024 * 1024, files: 2, fields: 10, fieldSize: 4096 },
  fileFilter: (req, arquivo, avisar) => {
    if (TIPOS_DE_IMAGEM[arquivo.mimetype]) {
      avisar(null, true)
    } else {
      const erro = new Error('Envie uma imagem JPG, PNG, WebP ou GIF.')
      erro.tipoDeArquivo = true
      avisar(erro)
    }
  },
})

const ASSINATURAS = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')),
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
}

function ehImagemDeVerdade(arquivo) {
  const confere = ASSINATURAS[arquivo.mimetype]
  return Boolean(confere) && arquivo.buffer.length > 12 && confere(arquivo.buffer)
}

function receberArquivos(middleware) {
  return (req, res, next) => {
    middleware(req, res, (erro) => {
      if (!erro) {
        const arquivos = [req.file, ...Object.values(req.files || {}).flat()].filter(Boolean)
        if (arquivos.some((arquivo) => !ehImagemDeVerdade(arquivo))) {
          return res.status(400).json({ erro: 'Esse arquivo não é uma imagem JPG, PNG, WebP ou GIF de verdade.' })
        }
        return next()
      }

      if (erro.tipoDeArquivo) {
        return res.status(400).json({ erro: erro.message })
      }
      if (erro instanceof multer.MulterError) {
        const mensagens = {
          LIMIT_FILE_SIZE: `A imagem pode ter até ${TAMANHO_MAXIMO_MB} MB.`,
          LIMIT_FILE_COUNT: 'Envie no máximo duas imagens por vez.',
          LIMIT_UNEXPECTED_FILE: 'Esse campo de arquivo não é aceito aqui.',
        }
        return res.status(400).json({ erro: mensagens[erro.code] || 'Não consegui receber a imagem.' })
      }
      next(erro)
    })
  }
}

function guardar(arquivo) {
  return salvarImagem(arquivo, TIPOS_DE_IMAGEM[arquivo.mimetype])
}

function texto(valor) {
  return typeof valor === 'string' ? valor : ''
}

function ipDe(req) {
  const encaminhado = req.headers['x-forwarded-for']
  if (process.env.VERCEL && encaminhado) {
    return String(encaminhado).split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'desconhecido'
}

const MINUTO = 60 * 1000

async function registrarEContar(chaves, minutos) {
  const momento = Date.now()
  const desde = momento - minutos * MINUTO
  const resultados = await emLote([
    ['DELETE FROM tentativas WHERE momento < ?', [momento - 24 * 60 * MINUTO]],
    ...chaves.map((chave) => ['INSERT INTO tentativas (chave, momento) VALUES (?, ?)', [chave, momento]]),
    ...chaves.map((chave) => [
      'SELECT COUNT(*) AS total FROM tentativas WHERE chave = ? AND momento > ?',
      [chave, desde],
    ]),
  ])
  return { momento, totais: resultados.slice(-chaves.length).map((linhas) => linhas[0].total) }
}

const MUITAS_TENTATIVAS = { erro: 'Muitas tentativas. Espere alguns minutos e tente de novo.' }

function limitar(acao, maximo, minutos) {
  return async (req, res, next) => {
    const { totais } = await registrarEContar([`${acao}:${req.usuarioId ?? ipDe(req)}`], minutos)
    if (totais[0] > maximo) {
      return res.status(429).json(MUITAS_TENTATIVAS)
    }
    next()
  }
}

function problemaNaSenha(senha, usuario) {
  if (senha.length < MINIMO_SENHA) {
    return `A senha deve ter pelo menos ${MINIMO_SENHA} caracteres.`
  }
  if (Buffer.byteLength(senha, 'utf8') > MAXIMO_BYTES_SENHA) {
    return 'A senha é longa demais (acentos e emojis ocupam mais espaço). Use uma mais curta.'
  }
  const minuscula = senha.toLowerCase()
  if (
    SENHAS_COMUNS.has(minuscula) ||
    /^(.)\1+$/.test(senha) ||
    minuscula === usuario ||
    (usuario.length >= 4 && minuscula.includes(usuario))
  ) {
    return 'Essa senha é fácil de adivinhar. Escolha outra.'
  }
  return ''
}

const COOKIE_SESSAO = 'lenss_sessao'
const DURACAO_SESSAO = 7 * 24 * 60 * MINUTO
const OPCOES_COOKIE = { httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: 'strict', path: '/' }

function resumo(valor) {
  return createHash('sha256').update(valor).digest('hex')
}

function lerCookie(req, nome) {
  for (const parte of texto(req.headers.cookie).split(';')) {
    const [chave, ...resto] = parte.trim().split('=')
    if (chave === nome) {
      try {
        return decodeURIComponent(resto.join('='))
      } catch {
        return ''
      }
    }
  }
  return ''
}

function sessaoDoCookie(req) {
  const token = lerCookie(req, COOKIE_SESSAO)
  if (!token) return ''
  try {
    const dados = jwt.verify(token, SEGREDO, { algorithms: ['HS256'] })
    return typeof dados.sid === 'string' ? dados.sid : ''
  } catch {
    return ''
  }
}

async function abrirSessao(res, usuarioId) {
  const sid = randomBytes(32).toString('hex')
  const agora = Date.now()
  const expira = agora + DURACAO_SESSAO
  await emLote([
    ['DELETE FROM sessoes WHERE expira < ?', [agora]],
    ['INSERT INTO sessoes (id, usuario_id, expira) VALUES (?, ?, ?)', [resumo(sid), usuarioId, expira]],
  ])
  const token = jwt.sign({ sid }, SEGREDO, { algorithm: 'HS256', expiresIn: DURACAO_SESSAO / 1000 })
  res.cookie(COOKIE_SESSAO, token, { ...OPCOES_COOKIE, maxAge: DURACAO_SESSAO })
  return { expira }
}

function fecharCookie(res) {
  res.clearCookie(COOKIE_SESSAO, OPCOES_COOKIE)
}

async function exigirLogin(req, res, next) {
  if (!lerCookie(req, COOKIE_SESSAO)) {
    return res.status(401).json({ erro: 'Faça login para continuar.' })
  }

  const sid = sessaoDoCookie(req)
  const sessao = sid
    ? await um('SELECT id, usuario_id FROM sessoes WHERE id = ? AND expira > ?', [resumo(sid), Date.now()])
    : undefined

  if (!sessao) {
    fecharCookie(res)
    return res.status(401).json({ erro: 'Sua sessão terminou. Faça login de novo.' })
  }

  req.usuarioId = sessao.usuario_id
  req.sessaoId = sessao.id
  next()
}

function buscarPessoa(id) {
  return um('SELECT id, usuario, nome, bio, foto, banner FROM usuarios WHERE id = ?', [id])
}

function contarSeguidores(id) {
  return um(
    `SELECT (SELECT COUNT(*) FROM seguidores WHERE seguido_id = :id) AS seguidores,
            (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = :id) AS seguindo`,
    { id: id },
  )
}

app.post('/login', async (req, res) => {
  const usuario = texto(req.body?.usuario).trim().replace(/^@/, '')
  const senha = texto(req.body?.senha)

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Informe o usuário e a senha.' })
  }

  const porConta = `login-conta:${usuario}`
  const porRede = `login-rede:${ipDe(req)}`
  const { momento, totais } = await registrarEContar([porConta, porRede], 15)
  if (totais[0] > 10 || totais[1] > 60) {
    return res.status(429).json(MUITAS_TENTATIVAS)
  }

  const pessoa = await um('SELECT id, senha FROM usuarios WHERE usuario = ?', [usuario])
  const senhaCabe = Buffer.byteLength(senha, 'utf8') <= MAXIMO_BYTES_SENHA

  if (!pessoa || !senhaCabe || !(await bcrypt.compare(senha, pessoa.senha))) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.' })
  }

  await emLote([
    ['DELETE FROM tentativas WHERE chave = ?', [porConta]],
    ['DELETE FROM tentativas WHERE chave = ? AND momento = ?', [porRede, momento]],
  ])

  res.json(await abrirSessao(res, pessoa.id))
})

app.post('/sair', async (req, res) => {
  const sid = sessaoDoCookie(req)
  if (sid) {
    await rodar('DELETE FROM sessoes WHERE id = ?', [resumo(sid)])
  }
  fecharCookie(res)
  res.json({ ok: true })
})

app.post('/cadastro', limitar('cadastro', 60, 60), async (req, res) => {
  const nome = texto(req.body?.nome).trim()
  const usuario = texto(req.body?.usuario).trim().replace(/^@/, '')
  const senha = texto(req.body?.senha)

  if (nome === '') {
    return res.status(400).json({ erro: 'Informe o seu nome.' })
  }

  if (nome.length > LIMITE_NOME) {
    return res.status(400).json({ erro: `O nome pode ter até ${LIMITE_NOME} caracteres.` })
  }

  if (!/^[a-z0-9._]{3,20}$/.test(usuario)) {
    return res.status(400).json({
      erro: 'O usuário deve ter de 3 a 20 caracteres: letras minúsculas, números, ponto ou sublinhado.',
    })
  }

  const problema = problemaNaSenha(senha, usuario)
  if (problema) {
    return res.status(400).json({ erro: problema })
  }

  const existe = await um('SELECT id FROM usuarios WHERE usuario = ?', [usuario])
  if (existe) {
    return res.status(409).json({ erro: 'Esse @ já existe. Escolha outro.' })
  }

  const resultado = await rodar('INSERT INTO usuarios (usuario, senha, nome) VALUES (?, ?, ?)', [
    usuario,
    await bcrypt.hash(senha, 10),
    nome,
  ])

  res.status(201).json(await abrirSessao(res, resultado.lastInsertRowid))
})

const AJUSTES = ['preencher', 'inteira']
const LIMITE_FOTOS = 3
const LIMITE_LEGENDA = 200
const LIMITE_BIO = 150

app.get('/feed', exigirLogin, async (req, res) => {
  const posts = await todos(
    `SELECT posts.id, posts.imagem, posts.legenda, posts.ajuste,
            usuarios.usuario AS autor, usuarios.nome AS nomeAutor, usuarios.foto AS fotoAutor,
            posts.usuario_id = :eu AS meu,
            (SELECT COUNT(*) FROM curtidas WHERE curtidas.post_id = posts.id) AS curtidas,
            EXISTS (SELECT 1 FROM curtidas WHERE post_id = posts.id AND usuario_id = :eu) AS curti,
            EXISTS (SELECT 1 FROM salvos WHERE post_id = posts.id AND usuario_id = :eu) AS salvei
     FROM posts
     JOIN usuarios ON usuarios.id = posts.usuario_id
     ORDER BY RANDOM()
     LIMIT 10`,
    { eu: req.usuarioId },
  )

  posts.forEach((post) => {
    post.meu = post.meu === 1
    post.curti = post.curti === 1
    post.salvei = post.salvei === 1
  })

  res.json(posts)
})

app.get('/perfil', exigirLogin, async (req, res) => {
  const pessoa = await buscarPessoa(req.usuarioId)

  pessoa.posts = await todos(
    'SELECT id, imagem, legenda, ajuste FROM posts WHERE usuario_id = ? ORDER BY id DESC',
    [req.usuarioId],
  )
  Object.assign(pessoa, await contarSeguidores(req.usuarioId))

  res.json(pessoa)
})

app.get('/usuarios/:usuario/posts', exigirLogin, async (req, res) => {
  const pessoa = await um('SELECT id, usuario, nome, bio, foto, banner FROM usuarios WHERE usuario = ?', [req.params.usuario])

  if (!pessoa) {
    return res.status(404).json({ erro: 'Pessoa não encontrada.' })
  }

  const posts = await todos(
    `SELECT posts.id, posts.imagem, posts.legenda, posts.ajuste,
            (SELECT COUNT(*) FROM curtidas WHERE curtidas.post_id = posts.id) AS curtidas,
            EXISTS (SELECT 1 FROM curtidas WHERE post_id = posts.id AND usuario_id = :eu) AS curti,
            EXISTS (SELECT 1 FROM salvos WHERE post_id = posts.id AND usuario_id = :eu) AS salvei
     FROM posts
     WHERE posts.usuario_id = :dono
     ORDER BY posts.id DESC`,
    { eu: req.usuarioId, dono: pessoa.id },
  )

  posts.forEach((post) => {
    post.curti = post.curti === 1
    post.salvei = post.salvei === 1
  })

  const numeros = await contarSeguidores(pessoa.id)
  const sigo = await um('SELECT 1 FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?', [req.usuarioId, pessoa.id])

  res.json({
    usuario: pessoa.usuario,
    nome: pessoa.nome,
    bio: pessoa.bio,
    foto: pessoa.foto,
    banner: pessoa.banner,
    seguidores: numeros.seguidores,
    seguindo: numeros.seguindo,
    sigo: Boolean(sigo),
    posts: posts,
  })
})

async function pessoaParaSeguir(req, res) {
  const pessoa = await um('SELECT id FROM usuarios WHERE usuario = ?', [req.params.usuario])
  if (!pessoa) {
    res.status(404).json({ erro: 'Pessoa não encontrada.' })
    return null
  }
  if (pessoa.id === req.usuarioId) {
    res.status(400).json({ erro: 'Você não pode seguir a si mesmo.' })
    return null
  }
  return pessoa
}

app.post('/usuarios/:usuario/seguir', exigirLogin, async (req, res) => {
  const pessoa = await pessoaParaSeguir(req, res)
  if (!pessoa) return
  await rodar('INSERT OR IGNORE INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)', [req.usuarioId, pessoa.id])
  res.json({ sigo: true, seguidores: (await contarSeguidores(pessoa.id)).seguidores })
})

app.delete('/usuarios/:usuario/seguir', exigirLogin, async (req, res) => {
  const pessoa = await pessoaParaSeguir(req, res)
  if (!pessoa) return
  await rodar('DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?', [req.usuarioId, pessoa.id])
  res.json({ sigo: false, seguidores: (await contarSeguidores(pessoa.id)).seguidores })
})

app.post('/posts', exigirLogin, limitar('posts', 20, 60), receberArquivos(upload.single('imagem')), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Escolha uma foto para publicar.' })
  }

  const { total } = await um('SELECT COUNT(*) AS total FROM posts WHERE usuario_id = ?', [req.usuarioId])
  if (total >= LIMITE_FOTOS) {
    return res.status(403).json({
      erro: `Cada perfil pode ter até ${LIMITE_FOTOS} fotos. Apague uma para postar outra.`,
    })
  }

  const legenda = texto(req.body.legenda).trim()
  if (legenda.length > LIMITE_LEGENDA) {
    return res.status(400).json({ erro: `A legenda pode ter até ${LIMITE_LEGENDA} caracteres.` })
  }

  const ajuste = AJUSTES.includes(req.body.ajuste) ? req.body.ajuste : 'preencher'
  const imagem = await guardar(req.file)

  const resultado = await rodar('INSERT INTO posts (usuario_id, imagem, legenda, ajuste) VALUES (?, ?, ?, ?)', [
    req.usuarioId,
    imagem,
    legenda,
    ajuste,
  ])

  res.status(201).json({ id: resultado.lastInsertRowid, imagem: imagem, legenda: legenda, ajuste: ajuste })
})

async function postExiste(id) {
  return (await um('SELECT id FROM posts WHERE id = ?', [id])) !== undefined
}

async function contarCurtidas(postId) {
  return (await um('SELECT COUNT(*) AS total FROM curtidas WHERE post_id = ?', [postId])).total
}

app.post('/posts/:id/curtida', exigirLogin, async (req, res) => {
  if (!(await postExiste(req.params.id))) {
    return res.status(404).json({ erro: 'Foto não encontrada.' })
  }
  await rodar('INSERT OR IGNORE INTO curtidas (usuario_id, post_id) VALUES (?, ?)', [req.usuarioId, req.params.id])
  res.json({ curti: true, curtidas: await contarCurtidas(req.params.id) })
})

app.delete('/posts/:id/curtida', exigirLogin, async (req, res) => {
  await rodar('DELETE FROM curtidas WHERE usuario_id = ? AND post_id = ?', [req.usuarioId, req.params.id])
  res.json({ curti: false, curtidas: await contarCurtidas(req.params.id) })
})

app.post('/posts/:id/salvo', exigirLogin, async (req, res) => {
  if (!(await postExiste(req.params.id))) {
    return res.status(404).json({ erro: 'Foto não encontrada.' })
  }
  await rodar('INSERT OR IGNORE INTO salvos (usuario_id, post_id) VALUES (?, ?)', [req.usuarioId, req.params.id])
  res.json({ salvei: true })
})

app.delete('/posts/:id/salvo', exigirLogin, async (req, res) => {
  await rodar('DELETE FROM salvos WHERE usuario_id = ? AND post_id = ?', [req.usuarioId, req.params.id])
  res.json({ salvei: false })
})

app.delete('/posts/:id', exigirLogin, async (req, res) => {
  const post = await um('SELECT id, imagem FROM posts WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuarioId])

  if (!post) {
    return res.status(404).json({ erro: 'Foto não encontrada.' })
  }

  await emLote([
    ['DELETE FROM curtidas WHERE post_id = ?', [post.id]],
    ['DELETE FROM salvos WHERE post_id = ?', [post.id]],
    ['DELETE FROM posts WHERE id = ?', [post.id]],
  ])

  await apagarImagem(post.imagem)

  res.json({ ok: true })
})

app.delete('/perfil', exigirLogin, receberArquivos(upload.none()), async (req, res) => {
  const senha = texto(req.body?.senha)
  const pessoa = await um('SELECT id, senha, foto, banner FROM usuarios WHERE id = ?', [req.usuarioId])

  const { totais } = await registrarEContar([`apagar-conta:${pessoa.id}`], 15)
  if (totais[0] > 5) {
    return res.status(429).json(MUITAS_TENTATIVAS)
  }

  const senhaCabe = Buffer.byteLength(senha, 'utf8') <= MAXIMO_BYTES_SENHA
  if (!senha || !senhaCabe || !(await bcrypt.compare(senha, pessoa.senha))) {
    return res.status(403).json({ erro: 'Senha incorreta.' })
  }

  const posts = await todos('SELECT imagem FROM posts WHERE usuario_id = ?', [pessoa.id])

  const fotosDela = 'SELECT id FROM posts WHERE usuario_id = ?'
  await emLote([
    [`DELETE FROM curtidas WHERE usuario_id = ? OR post_id IN (${fotosDela})`, [pessoa.id, pessoa.id]],
    [`DELETE FROM salvos WHERE usuario_id = ? OR post_id IN (${fotosDela})`, [pessoa.id, pessoa.id]],
    ['DELETE FROM seguidores WHERE seguidor_id = ? OR seguido_id = ?', [pessoa.id, pessoa.id]],
    ['DELETE FROM posts WHERE usuario_id = ?', [pessoa.id]],
    ['DELETE FROM sessoes WHERE usuario_id = ?', [pessoa.id]],
    ['DELETE FROM usuarios WHERE id = ?', [pessoa.id]],
  ])
  fecharCookie(res)

  for (const post of posts) {
    await apagarImagem(post.imagem)
  }
  await apagarImagem(pessoa.foto)
  await apagarImagem(pessoa.banner)

  res.json({ ok: true })
})

const arquivosDoPerfil = upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
])

app.patch('/perfil', exigirLogin, limitar('perfil', 30, 60), receberArquivos(arquivosDoPerfil), async (req, res) => {
  const foto = req.files?.foto?.[0]
  const banner = req.files?.banner?.[0]
  const nome = texto(req.body.nome).trim()
  const bio = texto(req.body.bio).trim()

  if (nome === '') {
    return res.status(400).json({ erro: 'O nome não pode ficar vazio.' })
  }

  if (nome.length > LIMITE_NOME) {
    return res.status(400).json({ erro: `O nome pode ter até ${LIMITE_NOME} caracteres.` })
  }

  if (bio.length > LIMITE_BIO) {
    return res.status(400).json({ erro: `A bio pode ter até ${LIMITE_BIO} caracteres.` })
  }

  let usuario = null
  if (req.body.usuario !== undefined) {
    usuario = texto(req.body.usuario).trim().replace(/^@/, '')

    if (!/^[a-z0-9._]{3,20}$/.test(usuario)) {
      return res.status(400).json({
        erro: 'O usuário deve ter de 3 a 20 caracteres: letras minúsculas, números, ponto ou sublinhado.',
      })
    }

    const dono = await um('SELECT id FROM usuarios WHERE usuario = ?', [usuario])
    if (dono && dono.id !== req.usuarioId) {
      return res.status(409).json({ erro: 'Esse @ já existe. Escolha outro.' })
    }
  }

  const antes = await um('SELECT foto, banner FROM usuarios WHERE id = ?', [req.usuarioId])

  await rodar('UPDATE usuarios SET nome = ?, bio = ? WHERE id = ?', [nome, bio, req.usuarioId])

  if (usuario !== null) {
    await rodar('UPDATE usuarios SET usuario = ? WHERE id = ?', [usuario, req.usuarioId])
  }

  if (foto) {
    await rodar('UPDATE usuarios SET foto = ? WHERE id = ?', [await guardar(foto), req.usuarioId])
    await apagarImagem(antes.foto)
  }

  if (banner) {
    await rodar('UPDATE usuarios SET banner = ? WHERE id = ?', [await guardar(banner), req.usuarioId])
    await apagarImagem(antes.banner)
  }

  res.json(await buscarPessoa(req.usuarioId))
})

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro)
  if (erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({ erro: 'Pedido inválido.' })
  }
  console.error(erro)
  res.status(500).json({ erro: 'Algo deu errado no servidor. Tente de novo.' })
})

export default app
