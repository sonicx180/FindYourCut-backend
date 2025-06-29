import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/hello/:id', (c) => {
  const data = c.req.param('id')
  return c.text(data)
})

app.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  console.log(body['img-file'])
})
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
