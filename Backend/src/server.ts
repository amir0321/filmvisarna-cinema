import express from 'express'
import dotenv from 'dotenv'
import pool, { initDb } from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Filmvisarna API is running' })
})

app.get('/api/movies', async (req, res) => {
  try {
    const { rows: movies } = await pool.query('SELECT * FROM movies ORDER BY id ASC')
    res.json(movies)
  } catch (error) {
    console.error('Error fetching movies:', error)
    res.status(500).json({ error: 'Failed to fetch movies' })
  }
})

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
  .catch(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} (Database offline)`)
    })
  })
