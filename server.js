// Custom Next.js server — raises HTTP socket timeouts so long-running
// Wav2Lip + GFPGAN jobs (up to ~10 min) don't get silently dropped.
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Default headersTimeout is 60 s — far too short for Wav2Lip + GFPGAN.
  server.requestTimeout = 600000  // 10 minutes
  server.headersTimeout = 620000  // must exceed requestTimeout

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
