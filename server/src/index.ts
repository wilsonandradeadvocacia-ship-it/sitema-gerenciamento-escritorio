import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { escritorioRouter } from './routes/escritorio.js'
import { clientesRouter } from './routes/clientes.js'
import { tabelasOabRouter } from './routes/tabelasOab.js'
import { contratosRouter } from './routes/contratos.js'
import { lancamentosRouter } from './routes/lancamentos.js'
import { eventosRouter } from './routes/eventos.js'
import { adminRouter } from './routes/admin.js'
import { assinaturaRouter } from './routes/assinatura.js'

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CORS_ORIGIN.split(',').map((s) => s.trim()) }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)
app.use('/api/escritorio', escritorioRouter)
app.use('/api/clientes', clientesRouter)
app.use('/api/tabelas-oab', tabelasOabRouter)
app.use('/api/contratos', contratosRouter)
app.use('/api/lancamentos', lancamentosRouter)
app.use('/api/eventos', eventosRouter)
app.use('/api/admin', adminRouter)
app.use('/api/assinatura', assinaturaRouter)

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor.' })
})

app.listen(PORT, () => {
  console.log(`API do escritório rodando em http://localhost:${PORT}`)
})
