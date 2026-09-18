import express from 'express'
import dotenv from 'dotenv'
import db from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Filmvisarna API is running' })
})

app.get('/api/movies', (req, res) => {
  try {
    const movies = db.prepare('SELECT * FROM movies').all()
    res.json(movies)
  } catch (error) {
    console.error('Error fetching movies:', error)
    res.status(500).json({ error: 'Failed to fetch movies' })
  }
})

app.listen(PORT, () => {
  console.log(`🎬 Server running on http://localhost:${PORT}`)
})
