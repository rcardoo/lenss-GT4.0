import bcrypt from 'bcryptjs'
import { rodar } from './banco.js'

const exemplos = [
  {
    usuario: 'ana',
    nome: 'Ana Souza',
    bio: 'Montanhas, trilhas e pôr do sol.',
    foto: 'perfil-ana.svg',
    posts: [
      { imagem: 'foto-01.svg', legenda: 'Fim de tarde na serra.' },
    ],
  },
  {
    usuario: 'bruno',
    nome: 'Bruno Lima',
    bio: 'Mar, vento e café quente.',
    foto: 'perfil-bruno.svg',
    posts: [
      { imagem: 'foto-04.svg', legenda: 'Maré baixa e mente tranquila.' },
    ],
  },
  {
    usuario: 'carla',
    nome: 'Carla Mendes',
    bio: 'Jardim, flores e plantas.',
    foto: 'perfil-carla.svg',
    posts: [
      { imagem: 'foto-07.svg', legenda: 'A primavera chegou no quintal.' },
    ],
  },
  {
    usuario: 'diego',
    nome: 'Diego Rocha',
    bio: 'Cidade grande, luzes e noite.',
    foto: 'perfil-diego.svg',
    posts: [
      { imagem: 'foto-10.svg', legenda: 'A cidade nunca dorme.' },
    ],
  },
  {
    usuario: 'elisa',
    nome: 'Elisa Torres',
    bio: 'Florestas, desertos e auroras.',
    foto: 'perfil-elisa.svg',
    posts: [
      { imagem: 'foto-13.svg', legenda: 'Silêncio de floresta.' },
    ],
  },
]

if (process.env.TURSO_DATABASE_URL) {
  throw new Error('O seed apaga tudo e só roda no banco do computador, nunca no online.')
}

await rodar('DELETE FROM sessoes')
await rodar('DELETE FROM tentativas')
await rodar('DELETE FROM seguidores')
await rodar('DELETE FROM curtidas')
await rodar('DELETE FROM salvos')
await rodar('DELETE FROM posts')
await rodar('DELETE FROM usuarios')

const SENHA_EXEMPLO = process.env.SEED_SENHA || '123456'
const senhaComHash = bcrypt.hashSync(SENHA_EXEMPLO, 10)

for (const pessoa of exemplos) {
  const resultado = await rodar('INSERT INTO usuarios (usuario, senha, nome, bio, foto) VALUES (?, ?, ?, ?, ?)', [
    pessoa.usuario,
    senhaComHash,
    pessoa.nome,
    pessoa.bio,
    pessoa.foto,
  ])

  for (const post of pessoa.posts) {
    await rodar('INSERT INTO posts (usuario_id, imagem, legenda) VALUES (?, ?, ?)', [
      resultado.lastInsertRowid,
      post.imagem,
      post.legenda,
    ])
  }
}

console.log('Pronto! Criei 5 pessoas e 5 posts de exemplo.')
console.log(
  process.env.SEED_SENHA
    ? 'Para entrar, use ana, bruno, carla, diego ou elisa, com a senha definida em SEED_SENHA no .env.'
    : 'Para entrar, use ana, bruno, carla, diego ou elisa, com a senha 123456.',
)
