import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

dotenv.config()
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      message: 'Nedostaje token.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, 'auctiongo_secret_key')

    req.user = decoded

    next()
  } catch {
    return res.status(401).json({
      message: 'Nevažeći token.',
    })
  }
}

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
      null,
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

  const token = jwt.sign(
    {
      korisnik_sifra: user.korisnik_sifra,
      korisnik_username: user.korisnik_username,
    },
    'auctiongo_secret_key',
    { expiresIn: '24h' },
  )

  res.json({
    message: 'Prijava je uspješna.',
    user,
    token,
  })
})

app.post('/complete-profile', verifyToken, async (req, res) => {
  const { oib, adresa, mobitel, iban, uvjetiSifra } = req.body
  const userId = req.user.korisnik_sifra

  await db.query(
    `UPDATE PI2_proj_KORISNIK
     SET
       korisnik_OIB = ?,
       korisnik_adresa = ?,
       korisnik_mob = ?,
       korisnik_IBAN = ?,
       korisnik_verificiran = 'da',
       korisnik_uvj_koristenja_sifra = ?
     WHERE korisnik_sifra = ?`,
    [oib, adresa, mobitel, iban, uvjetiSifra, userId],
  )

  res.json({
    message: 'Profil je uspješno dovršen.',
  })
})

app.get('/categories', async (req, res) => {
  const [categories] = await db.query(`
    SELECT
      kategorija_sifra,
      kategorija_naziv
    FROM PI2_proj_KATEGORIJA
    ORDER BY kategorija_naziv
  `)

  res.json(categories)
})

app.post('/artifact', verifyToken, async (req, res) => {
  const {
    naziv,
    opis,
    marka,
    model,
    datumProizvodnje,
    kategorijaSifra,
    stanje,
    trazenaCijena,
    dokazVlasnistva,
  } = req.body

  const korisnikSifra = req.user.korisnik_sifra

  const [result] = await db.query(
    `INSERT INTO PI2_proj_ARTEFAKT (
      artefakt_naziv,
      artefakt_opis,
      artefakt_marka,
      artefakt_model,
      artefakt_datum_proizvodnje,
      artefakt_dokaz_vlasnistva,
      artefakt_stanje,
      artefakt_cijena_trazena,
      artefakt_korisnik_sifra,
      artefakt_kategorija_sifra
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      naziv,
      opis,
      marka || null,
      model || null,
      datumProizvodnje || null,
      dokazVlasnistva || null,
      stanje,
      trazenaCijena || null,
      korisnikSifra,
      kategorijaSifra,
    ],
  )

  const artefaktSifra = result.insertId

  if (req.body.fotografije?.length) {
    for (let i = 0; i < req.body.fotografije.length; i++) {
      await db.query(
        `INSERT INTO PI2_proj_ARTEFAKT_FOTOGRAFIJA (
        fotografija_podatak,
        fotografija_redni_broj,
        fotografija_artefakt_sifra
      ) VALUES (?, ?, ?)`,
        [req.body.fotografije[i], i + 1, artefaktSifra],
      )
    }
  }

  res.json({
    message: 'Artefakt je uspješno poslan na procjenu.',
    artefakt_sifra: artefaktSifra,
  })
})

app.listen(3000, () => {
  console.log('Server pokrenut na portu 3000.')
})
