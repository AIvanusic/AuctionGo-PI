import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

dotenv.config()
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)

const app = express()

app.use(cors())
app.use(express.json())

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
})

console.log('Spojena baza podataka')

app.get('/', (req, res) => {
  res.json({
    message: 'AuctionGO backend radi',
  })
})

app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Frontend može dohvatiti backend',
  })
})

app.get('/testdb', async (req, res) => {
  const [rows] = await db.query(`
    SELECT
      korisnik_username,
      korisnik_email
    FROM PI2_proj_KORISNIK
  `)

  res.json(rows)
})

app.get('/register', (req, res) => {
  res.json({
    message: 'GET register ruta radi',
  })
})

app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const [existingUsers] = await db.query(
    `SELECT korisnik_sifra
   FROM PI2_proj_KORISNIK
   WHERE korisnik_username = ?
      OR korisnik_email = ?`,
    [username, email],
  )

  if (existingUsers.length > 0) {
    return res.status(400).json({
      message: 'Korisničko ime ili email već postoje.',
    })
  }

  const [result] = await db.query(
    `INSERT INTO PI2_proj_KORISNIK (
      korisnik_ime,
      korisnik_prezime,
      korisnik_OIB,
      korisnik_uloga,
      korisnik_username,
      korisnik_pass,
      korisnik_IBAN,
      korisnik_adresa,
      korisnik_email,
      korisnik_mob,
      korisnik_status,
      korisnik_uvj_koristenja_sifra,
      korisnik_kupac,
      korisnik_prodavatelj,
      korisnik_procjenitelj,
      korisnik_voditelj,
      korisnik_admin,
      korisnik_superadmin,
      korisnik_verificiran
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      firstName,
      lastName,
      null,
      'ponuditelj',
      username,
      hashedPassword,
      null,
      null,
      email,
      null,
      'aktivan',
      1,
      'da',
      'da',
      'ne',
      'ne',
      'ne',
      'ne',
      'ne',
    ],
  )

  res.json({
    message: 'Korisnik je uspješno registriran.',
    korisnik_sifra: result.insertId,
  })
})

app.post('/login', async (req, res) => {
  const { login, password } = req.body

  const [users] = await db.query(
    `SELECT
      korisnik_sifra,
      korisnik_ime,
      korisnik_prezime,
      korisnik_username,
      korisnik_email,
      korisnik_pass,
      korisnik_status,
      korisnik_kupac,
      korisnik_prodavatelj,
      korisnik_procjenitelj,
      korisnik_voditelj,
      korisnik_admin,
      korisnik_superadmin,
      korisnik_verificiran
    FROM PI2_proj_KORISNIK
    WHERE korisnik_username = ?
       OR korisnik_email = ?
    LIMIT 1`,
    [login, login],
  )

  if (users.length === 0) {
    return res.status(401).json({
      message: 'Neispravno korisničko ime/email ili lozinka.',
    })
  }

  const user = users[0]

  const passwordOk = await bcrypt.compare(password, user.korisnik_pass)

  if (!passwordOk) {
    return res.status(401).json({
      message: 'Neispravno korisničko ime/email ili lozinka.',
    })
  }

  if (user.korisnik_status !== 'aktivan') {
    return res.status(403).json({
      message: 'Korisnički račun nije aktivan.',
    })
  }

  delete user.korisnik_pass

  res.json({
    message: 'Prijava je uspješna.',
    user,
  })
})

app.post('/complete-profile', async (req, res) => {
  const { userId, oib, adresa, mobitel, iban } = req.body

  await db.query(
    `UPDATE PI2_proj_KORISNIK
     SET
       korisnik_OIB = ?,
       korisnik_adresa = ?,
       korisnik_mob = ?,
       korisnik_IBAN = ?,
       korisnik_verificiran = 'da'
     WHERE korisnik_sifra = ?`,
    [oib, adresa, mobitel, iban, userId],
  )

  res.json({
    message: 'Profil je uspješno dovršen.',
  })
})

app.listen(3000, () => {
  console.log('Server pokrenut na portu 3000.')
})
