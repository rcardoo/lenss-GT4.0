import app from './app.js'

const PORTA = Number(process.env.PORT || process.env.PORTA) || 3000

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`)
})
