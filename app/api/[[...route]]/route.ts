import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import chatHandler from '../../../api-chat'
import filesHandler from '../../../api-files'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api')

app.get('/chat', chatHandler)
app.get('/files', filesHandler)

export const GET = handle(app)
export const POST = handle(app)
