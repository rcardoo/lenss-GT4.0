import { todos } from './banco.js'

console.log('1. Todas as pessoas')
console.table(await todos('SELECT id, usuario, nome FROM usuarios'))

console.log('2. Os posts da pessoa com id 1')
console.table(await todos('SELECT id, imagem, legenda FROM posts WHERE usuario_id = ?', [1]))

console.log('3. Os mesmos posts, do mais novo para o mais antigo')
console.table(await todos('SELECT id, imagem, legenda FROM posts WHERE usuario_id = ? ORDER BY id DESC', [1]))

console.log('4. Os seis primeiros posts, com o nome de quem publicou')
console.table(
  await todos(
    `SELECT posts.id, posts.legenda, usuarios.usuario AS autor
     FROM posts
     JOIN usuarios ON usuarios.id = posts.usuario_id
     LIMIT 6`,
  ),
)

console.log('5. Três posts sorteados')
console.table(
  await todos(
    `SELECT posts.id, posts.legenda, usuarios.usuario AS autor
     FROM posts
     JOIN usuarios ON usuarios.id = posts.usuario_id
     ORDER BY RANDOM()
     LIMIT 3`,
  ),
)
