const express = require('express')
const history = require('connect-history-api-fallback')
const path = require('path')
const morgan = require('morgan')
const split = require('split')
const compression = require('compression')
const logger = require('../helpers/logger')

const app = express()

const port = process.env.PORT || 8080

app.use(history())

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Content-Type')

  next()
})

app.use(
  morgan('combined', {
    skip: (req, res) => {
      return parseInt(res.statusCode) < 400
    },
    stream: split().on('data', (data) => {
      logger.error(data)
    })
  })
)

app.use(
  morgan('combined', {
    skip: (req, res) => {
      return parseInt(res.statusCode) >= 400
    },
    stream: split().on('data', (data) => {
      logger.info(data)
    })
  })
)

app.use(compression())

app.use(express.static(path.join(__dirname, '/dist')))

app.get('*', (request, response) => {
  response.sendFile(path.resolve(path.join(__dirname, '/dist'), 'index.html'))
})

app.listen(port)
logger.log(`Server started on port ${port}`)
