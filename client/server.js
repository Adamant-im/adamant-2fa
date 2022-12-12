const express = require('express')
const history = require('connect-history-api-fallback')
const path = require('path')
const port = process.env.PORT || 8080
const app = express()

app.use(history())

app.use(express.static(path.join(__dirname, '/dist')))

app.get('*', (request, response) => {
  response.sendFile(path.resolve(path.join(__dirname, '/dist'), 'index.html'))
})

app.listen(port)
console.log(`Server started on port ${port}`)
