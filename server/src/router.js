import express from 'express'
import eleicoes2014 from './controllers/eleicoes2014.js'

const routes = express()
routes.use(express.json())

routes.get('/:uf/municipios', eleicoes2014.municipios)
routes.get('/:uf', eleicoes2014.uf)
routes.get('/', eleicoes2014.uf)

export default routes