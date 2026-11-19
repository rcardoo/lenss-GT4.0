import piquenique from './assets/fundos/piquenique.jpg'
import sombra from './assets/fundos/sombra.jpg'
import faixa from './assets/fundos/faixa.jpg'
import capim from './assets/fundos/capim.jpg'
import varanda from './assets/fundos/varanda.jpg'

const FUNDOS = [
  { foto: piquenique, posicao: '50% 60%' },
  { foto: sombra, posicao: '50% 45%' },
  { foto: faixa, posicao: '50% 50%' },
  { foto: capim, posicao: '50% 50%' },
  { foto: varanda, posicao: '50% 50%' },
]

export const fundoSorteado = FUNDOS[Math.floor(Math.random() * FUNDOS.length)]
