import fs from 'fs'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'

const app = new Hono()
app.use('*', cors())
app.use('*', prettyJSON())

const initializeRoutes = (app) => {
  const routesFolder = fs.readdirSync('./routes')
  routesFolder.forEach(route => {
    import(`./routes/${route}`).then(routeFile => {
      const { method, path, Process } = routeFile
      if (method === 'GET') {
        app.get(path, (c) => Process(c))
      } else if (method === 'POST') {
        app.post(path, (c) => Process(c))
      }
    })
  })
}
initializeRoutes(app)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})