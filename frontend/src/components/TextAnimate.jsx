import { motion } from 'motion/react'

const DURACAO = 0.3

const TRANSICAO = { y: { duration: 0.3 }, opacity: { duration: 0.4 }, filter: { duration: 0.3 } }

const LETRA = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
  show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: TRANSICAO },
}

const ESTILO_LETRA = { display: 'inline-block', whiteSpace: 'pre' }

function TextAnimate({ children, className }) {
  const letras = children.split('')
  const conjunto = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: DURACAO / letras.length } },
  }

  return (
    <motion.span
      className={className}
      style={{ whiteSpace: 'pre-wrap' }}
      variants={conjunto}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      <span className="visually-hidden">{children}</span>
      {letras.map((letra, i) => (
        <motion.span key={i} variants={LETRA} style={ESTILO_LETRA} aria-hidden="true">
          {letra}
        </motion.span>
      ))}
    </motion.span>
  )
}

export default TextAnimate
