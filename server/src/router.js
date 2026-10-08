import express from 'express'
import eleicoes from './controllers/eleicoes.js'

const router = express.Router()

// Rotas de uma eleição (ano/turno já resolvidos em req.eleicao)
const eleicaoRouter = express.Router({ mergeParams: true })
eleicaoRouter.get('/estados/:uf/municipios', eleicoes.municipios)
eleicaoRouter.get('/estados/:uf', eleicoes.uf)
eleicaoRouter.get('/estados', eleicoes.uf)
eleicaoRouter.get('/meta', eleicoes.meta)

router.get('/eleicoes', eleicoes.lista)

// Rota legada (front em produção): 2014, 1º turno
router.use('/eleicao/2014/presidente/primeiro-turno', eleicoes.fixedEleicao('2014-1'), eleicaoRouter)

router.use('/eleicao/:ano/presidente/:turno', eleicoes.resolveEleicao, eleicaoRouter)

router.use((req, res) => res.status(404).json({ mensagem: 'Not found' }))

export default router
