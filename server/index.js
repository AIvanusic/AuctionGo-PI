import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = process.env.PORT || 3000

dotenv.config()
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:9000',
  },
})

io.on('connection', (socket) => {
  console.log('Socket spojen:', socket.id)

  socket.on('disconnect', () => {
    console.log('Socket odspojen:', socket.id)
  })
})

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

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 20000,
})

console.log('Pool veza s bazom podataka je spremna')

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
      korisnik_adresa,
      korisnik_mob,
      korisnik_IBAN,
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

app.get('/api/user/profile', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        korisnik_sifra,
        korisnik_ime,
        korisnik_prezime,
        korisnik_username,
        korisnik_email,
        korisnik_adresa,
        korisnik_mob,
        korisnik_IBAN,
        korisnik_status,
        korisnik_verificiran
      FROM PI2_proj_KORISNIK
      WHERE korisnik_sifra = ?
      `,
      [userId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Korisnik nije pronađen.',
      })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('Greška kod dohvaćanja profila:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja profila.',
    })
  }
})

app.put('/api/user/profile', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra
  const { ime, prezime, email, adresa, mobitel, iban } = req.body

  try {
    await db.query(
      `
      UPDATE PI2_proj_KORISNIK
      SET
        korisnik_ime = ?,
        korisnik_prezime = ?,
        korisnik_email = ?,
        korisnik_adresa = ?,
        korisnik_mob = ?,
        korisnik_IBAN = ?
      WHERE korisnik_sifra = ?
      `,
      [ime, prezime, email, adresa, mobitel, iban, userId],
    )

    res.json({
      message: 'Korisnički podaci su ažurirani.',
    })
  } catch (error) {
    console.error('Greška kod ažuriranja profila:', error)

    res.status(500).json({
      message: 'Greška kod ažuriranja profila.',
    })
  }
})

app.put('/api/user/deactivate', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    await db.query(
      `
      UPDATE PI2_proj_KORISNIK
      SET korisnik_status = 'neaktivan'
      WHERE korisnik_sifra = ?
      `,
      [userId],
    )

    res.json({
      message: 'Korisnički račun je deaktiviran.',
    })
  } catch (error) {
    console.error('Greška kod deaktivacije računa:', error)

    res.status(500).json({
      message: 'Greška kod deaktivacije računa.',
    })
  }
})

app.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT
        kategorija_sifra,
        kategorija_naziv
      FROM PI2_proj_KATEGORIJA
      ORDER BY kategorija_naziv
    `)

    res.json(categories)
  } catch (error) {
    console.error('Greška kod dohvaćanja kategorija:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja kategorija.',
    })
  }
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

app.get('/my-artifacts', verifyToken, async (req, res) => {
  const korisnikSifra = req.user.korisnik_sifra

  const [artifacts] = await db.query(
    `SELECT
  a.artefakt_sifra,
  a.artefakt_naziv,
  a.artefakt_opis,
  a.artefakt_marka,
  a.artefakt_model,
  a.artefakt_datum_proizvodnje,
  a.artefakt_stanje,
  a.artefakt_cijena_trazena,
  a.artefakt_odobren,
  a.artefakt_odbijen,
  a.artefakt_povucen,
  a.artefakt_prodan,
  a.artefakt_korisnik_sifra AS prodavatelj_sifra,
  a.artefakt_zahtjev_povlacenje,
  k.kategorija_naziv,
  auk.aukcija_sifra,
  auk.aukcija_pocetak,
  auk.aukcija_kraj,
  auk.aukcija_status,
  auk.aukcija_statusend,
  auk.aukcija_ugovor,
  auk.aukcija_ugovor_datum,
  auk.aukcija_ugovor_kupac_prihvatio,
  auk.aukcija_ugovor_prodavatelj_prihvatio,
  auk.aukcija_kupac_uplatio,
  auk.aukcija_ugovor_potvrdaplacanja,
  auk.aukcija_ugovor_potvrdaisporuke,
  auk.aukcija_kupac_preuzeo,
  auk.aukcija_ugovor_artefaktodgovara,
  sys.recenzija_sustava_sifra AS moja_recenzija_sustava_sifra
FROM PI2_proj_ARTEFAKT a
JOIN PI2_proj_KATEGORIJA k
  ON a.artefakt_kategorija_sifra = k.kategorija_sifra
LEFT JOIN PI2_proj_AUKCIJA auk
  ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
LEFT JOIN PI2_proj_RECENZIJA_SUSTAVA sys
  ON sys.recenzija_sustava_aukcija_sifra = auk.aukcija_sifra
  AND sys.recenzija_sustava_korisnik_sifra = ?
WHERE a.artefakt_korisnik_sifra = ?
ORDER BY a.artefakt_sifra DESC`,
    [korisnikSifra, korisnikSifra],
  )

  res.json(artifacts)
})

app.get('/api/test-admin', (req, res) => {
  res.json({ message: 'Admin test ruta radi.' })
})

app.get('/api/admin/artifacts', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_marka,
        a.artefakt_model,
        a.artefakt_stanje,
        a.artefakt_cijena_trazena,
        a.artefakt_procjena_sifra,
        a.artefakt_procjenitelj_sifra,
        a.artefakt_voditelj_sifra,
        a.artefakt_odobren,
        a.artefakt_odbijen,
        a.artefakt_povucen,
        a.artefakt_prodan,
        k.korisnik_ime,
        k.korisnik_prezime,
        k.korisnik_email,
        v.korisnik_username AS voditelj_username
      FROM PI2_proj_ARTEFAKT a
      JOIN PI2_proj_KORISNIK k
        ON a.artefakt_korisnik_sifra = k.korisnik_sifra
      LEFT JOIN PI2_proj_KORISNIK v
        ON a.artefakt_voditelj_sifra = v.korisnik_sifra
      ORDER BY a.artefakt_sifra DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata za admina:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.get('/api/admin/users', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        korisnik_sifra,
        korisnik_ime,
        korisnik_prezime,
        korisnik_username,
        korisnik_email,
        korisnik_status,
        korisnik_uloga,
        korisnik_kupac,
        korisnik_prodavatelj,
        korisnik_procjenitelj,
        korisnik_voditelj,
        korisnik_admin,
        korisnik_superadmin,
        korisnik_verificiran
      FROM PI2_proj_KORISNIK
      ORDER BY korisnik_sifra DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja korisnika za admina:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.get('/api/appraisers', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        korisnik_sifra,
        korisnik_ime,
        korisnik_prezime,
        korisnik_username,
        korisnik_email
      FROM PI2_proj_KORISNIK
      WHERE korisnik_procjenitelj = 'da'
        AND korisnik_status = 'aktivan'
      ORDER BY korisnik_prezime ASC, korisnik_ime ASC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja procjenitelja:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.put('/api/admin/artifacts/:artifactId/assign-appraiser', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const { appraiserId } = req.body

  try {
    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET artefakt_procjenitelj_sifra = ?
      WHERE artefakt_sifra = ?
      `,
      [appraiserId, artifactId],
    )

    res.json({ message: 'Artefakt je dodijeljen procjenitelju.' })
  } catch (error) {
    console.error('Greška kod dodjele procjenitelja:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.get('/api/appraiser/my-artifacts', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_marka,
        a.artefakt_model,
        a.artefakt_stanje,
        a.artefakt_datum_proizvodnje,
        a.artefakt_opis,
        a.artefakt_cijena_trazena,
        a.artefakt_procjena_sifra,
        kat.kategorija_naziv,
        k.korisnik_ime,
        k.korisnik_prezime,
        k.korisnik_email
      FROM PI2_proj_ARTEFAKT a
      JOIN PI2_proj_KORISNIK k
        ON a.artefakt_korisnik_sifra = k.korisnik_sifra
      LEFT JOIN PI2_proj_KATEGORIJA kat
        ON a.artefakt_kategorija_sifra = kat.kategorija_sifra
      WHERE a.artefakt_procjenitelj_sifra = ?
        AND a.artefakt_procjena_sifra IS NULL
        AND a.artefakt_povucen = 'nije povucen'
      ORDER BY a.artefakt_sifra DESC
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata procjenitelja:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.post('/api/appraiser/artifacts/:artifactId/appraisal', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const userId = req.user.korisnik_sifra

  const {
    procjena_opis,
    procjena_fotografija,
    procjena_dodatni_dokazi,
    procjena_cijena_procijenjena,
    procjena_preporuka,
  } = req.body

  try {
    const [assignedArtifacts] = await db.query(
      `
      SELECT artefakt_sifra
      FROM PI2_proj_ARTEFAKT
      WHERE artefakt_sifra = ?
        AND artefakt_procjenitelj_sifra = ?
      `,
      [artifactId, userId],
    )

    if (assignedArtifacts.length === 0) {
      return res.status(403).json({
        message: 'Nemate ovlasti procijeniti ovaj artefakt.',
      })
    }

    const [result] = await db.query(
      `
      INSERT INTO PI2_proj_PROCJENA (
        procjena_opis,
        procjena_fotografija,
        procjena_dodatni_dokazi,
        procjena_cijena_procijenjena,
        procjena_korisnik_sifra,
        procjena_preporuka
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        procjena_opis,
        procjena_fotografija || null,
        procjena_dodatni_dokazi || null,
        procjena_cijena_procijenjena,
        userId,
        procjena_preporuka,
      ],
    )

    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET artefakt_procjena_sifra = ?
      WHERE artefakt_sifra = ?
      `,
      [result.insertId, artifactId],
    )

    res.json({
      message: 'Procjena je uspješno spremljena.',
      procjena_sifra: result.insertId,
    })
  } catch (error) {
    console.error('Greška kod spremanja procjene:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.get('/api/artifacts/:artifactId/photos', verifyToken, async (req, res) => {
  const { artifactId } = req.params

  try {
    const [photos] = await db.query(
      `
      SELECT
        fotografija_podatak,
        fotografija_redni_broj
      FROM PI2_proj_ARTEFAKT_FOTOGRAFIJA
      WHERE fotografija_artefakt_sifra = ?
      ORDER BY fotografija_redni_broj ASC
      `,
      [artifactId],
    )

    res.json(photos)
  } catch (error) {
    console.error('Greška kod dohvaćanja fotografija artefakta:', error)
    res.status(500).json({ message: 'Greška kod dohvaćanja fotografija.' })
  }
})

app.get('/api/appraiser/appraisal-history', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_stanje,
        p.procjena_cijena_procijenjena,
        p.procjena_preporuka,
        p.procjena_datum
      FROM PI2_proj_PROCJENA p
      JOIN PI2_proj_ARTEFAKT a
        ON a.artefakt_procjena_sifra = p.procjena_sifra
      WHERE p.procjena_korisnik_sifra = ?
      ORDER BY p.procjena_datum DESC
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja povijesti procjena:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.get('/api/admin/appraisals', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        k.korisnik_ime,
        k.korisnik_prezime,
        p.procjena_sifra,
        p.procjena_cijena_procijenjena,
        p.procjena_preporuka,
        p.procjena_datum
      FROM PI2_proj_ARTEFAKT a
      JOIN PI2_proj_PROCJENA p
        ON a.artefakt_procjena_sifra = p.procjena_sifra
      JOIN PI2_proj_KORISNIK k
        ON a.artefakt_korisnik_sifra = k.korisnik_sifra
        WHERE a.artefakt_odobren = 'nije odobren'
  AND a.artefakt_odbijen = 'nije odbijen'
      ORDER BY p.procjena_datum DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja procjena za admina:', error)
    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.put('/api/admin/artifacts/:artifactId/approve', verifyToken, async (req, res) => {
  const { artifactId } = req.params

  try {
    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET
        artefakt_odobren = 'odobren',
        artefakt_odbijen = 'nije odbijen'
      WHERE artefakt_sifra = ?
      `,
      [artifactId],
    )

    res.json({
      message: 'Artefakt je odobren.',
    })
  } catch (error) {
    console.error('Greška kod odobravanja artefakta:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.put('/api/admin/artifacts/:artifactId/reject', verifyToken, async (req, res) => {
  const { artifactId } = req.params

  try {
    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET
        artefakt_odobren = 'nije odobren',
        artefakt_odbijen = 'odbijen'
      WHERE artefakt_sifra = ?
      `,
      [artifactId],
    )

    res.json({
      message: 'Artefakt je odbijen.',
    })
  } catch (error) {
    console.error('Greška kod odbijanja artefakta:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.get('/api/admin/approved-artifacts', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_stanje,
        a.artefakt_cijena_trazena,
        k.korisnik_ime,
        k.korisnik_prezime
      FROM PI2_proj_ARTEFAKT a
      JOIN PI2_proj_KORISNIK k
        ON a.artefakt_korisnik_sifra = k.korisnik_sifra
      WHERE a.artefakt_odobren = 'odobren'
      AND a.artefakt_voditelj_sifra IS NULL
      AND a.artefakt_povucen = 'nije povucen'
      ORDER BY a.artefakt_sifra DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja odobrenih artefakata:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.get('/api/managers', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        korisnik_sifra,
        korisnik_ime,
        korisnik_prezime,
        korisnik_username,
        korisnik_email
      FROM PI2_proj_KORISNIK
      WHERE korisnik_voditelj = 'da'
        AND korisnik_status = 'aktivan'
      ORDER BY korisnik_prezime ASC, korisnik_ime ASC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja voditelja:', error)
    res.status(500).json({ message: 'Greška na serveru.' })
  }
})

app.put('/api/admin/artifacts/:artifactId/assign-manager', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const { managerId } = req.body

  try {
    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET artefakt_voditelj_sifra = ?
      WHERE artefakt_sifra = ?
      `,
      [managerId, artifactId],
    )

    res.json({
      message: 'Artefakt je dodijeljen voditelju aukcije.',
    })
  } catch (error) {
    console.error('Greška kod dodjele voditelja:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.get('/api/manager/my-artifacts', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_marka,
        a.artefakt_model,
        a.artefakt_stanje,
        a.artefakt_cijena_trazena,
        a.artefakt_odobren,
        k.korisnik_ime,
        k.korisnik_prezime,
        k.korisnik_email,
        p.procjena_cijena_procijenjena,
        p.procjena_preporuka,
        a.artefakt_korisnik_sifra AS prodavatelj_sifra
      FROM PI2_proj_ARTEFAKT a
      JOIN PI2_proj_KORISNIK k
        ON a.artefakt_korisnik_sifra = k.korisnik_sifra
        LEFT JOIN PI2_proj_PROCJENA p
        ON a.artefakt_procjena_sifra = p.procjena_sifra
      WHERE a.artefakt_voditelj_sifra = ?
        AND a.artefakt_odobren = 'odobren'
        AND a.artefakt_prodan = 'nije prodan'
        AND a.artefakt_povucen = 'nije povucen'
  AND NOT EXISTS (
    SELECT 1
    FROM PI2_proj_AUKCIJA auk
    WHERE auk.aukcija_artefakt_sifra = a.artefakt_sifra
      AND auk.aukcija_status IN ('ceka', 'prvi poziv', 'drugi poziv', 'zadnji poziv')
  )
      ORDER BY a.artefakt_sifra DESC
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata voditelja:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.post('/api/manager/artifacts/:artifactId/create-auction', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const userId = req.user.korisnik_sifra

  const {
    aukcija_naziv,
    aukcija_cijena_pocetna,
    aukcija_cijena_rezervirana,
    aukcija_pocetak,
    aukcija_kraj,
  } = req.body

  try {
    const [assignedArtifacts] = await db.query(
      `
      SELECT artefakt_sifra
      FROM PI2_proj_ARTEFAKT
      WHERE artefakt_sifra = ?
        AND artefakt_voditelj_sifra = ?
        AND artefakt_odobren = 'odobren'
      `,
      [artifactId, userId],
    )

    if (assignedArtifacts.length === 0) {
      return res.status(403).json({
        message: 'Nemate ovlasti kreirati aukciju za ovaj artefakt.',
      })
    }

    const [result] = await db.query(
      `
      INSERT INTO PI2_proj_AUKCIJA (
        aukcija_naziv,
        aukcija_cijena_pocetna,
        aukcija_cijena_rezervirana,
        aukcija_pocetak,
        aukcija_kraj,
        aukcija_tip,
        aukcija_status,
        aukcija_cijena_trenutna,
        aukcija_artefakt_sifra,
        aukcija_korisnik_sifra
      )
      VALUES (?, ?, ?, ?, ?, 'EN', 'ceka', ?, ?, ?)
      `,
      [
        aukcija_naziv,
        aukcija_cijena_pocetna,
        aukcija_cijena_rezervirana,
        aukcija_pocetak,
        aukcija_kraj,
        aukcija_cijena_pocetna,
        artifactId,
        userId,
      ],
    )

    res.json({
      message: 'Aukcija je uspješno kreirana.',
      aukcija_sifra: result.insertId,
    })
  } catch (error) {
    console.error('Greška kod kreiranja aukcije:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.get('/api/manager/completed-auctions', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        auk.aukcija_sifra,
        auk.aukcija_naziv,
        auk.aukcija_cijena_konacna,
        auk.aukcija_status,
        auk.aukcija_statusend,
        auk.aukcija_ugovor,
        auk.aukcija_ugovor_datum,
        auk.aukcija_ugovor_kupac_prihvatio,
        auk.aukcija_ugovor_prodavatelj_prihvatio,
        auk.aukcija_kupac_uplatio,
        auk.aukcija_ugovor_potvrdaplacanja,
        auk.aukcija_ugovor_potvrdaisporuke,
        auk.aukcija_kupac_preuzeo,
        auk.aukcija_ugovor_artefaktodgovara,
        a.artefakt_naziv,
        prod.korisnik_ime AS prodavatelj_ime,
        prod.korisnik_prezime AS prodavatelj_prezime,
        kup.korisnik_ime AS kupac_ime,
        kup.korisnik_prezime AS kupac_prezime
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      JOIN PI2_proj_KORISNIK prod
        ON a.artefakt_korisnik_sifra = prod.korisnik_sifra
      JOIN PI2_proj_PONUDA pobjednicka
  ON pobjednicka.ponuda_aukcija_sifra = auk.aukcija_sifra
  AND pobjednicka.ponuda_cijena_ponudjena = auk.aukcija_cijena_konacna
  JOIN PI2_proj_KORISNIK kup
        ON pobjednicka.ponuda_korisnik_sifra = kup.korisnik_sifra
      WHERE auk.aukcija_korisnik_sifra = ?
        AND auk.aukcija_status = 'zavrsena'
        AND auk.aukcija_statusend IN ('uspjesno zavrsena', 'transakcija zavrsena', 'reklamacija')
      ORDER BY auk.aukcija_kraj DESC
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja završenih aukcija voditelja:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja završenih aukcija.',
    })
  }
})

app.put('/api/manager/auctions/:auctionId/generate-contract', verifyToken, async (req, res) => {
  const { auctionId } = req.params

  try {
    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET
        aukcija_ugovor = 'da',
        aukcija_ugovor_datum = NOW()
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    res.json({
      message: 'Ugovor je generiran.',
    })
  } catch (error) {
    console.error('Greška kod generiranja ugovora:', error)

    res.status(500).json({
      message: 'Greška kod generiranja ugovora.',
    })
  }
})

app.get('/api/auctions', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        auk.aukcija_sifra,
        auk.aukcija_naziv,
        auk.aukcija_cijena_pocetna,
        auk.aukcija_cijena_trenutna,
        auk.aukcija_pocetak,
        auk.aukcija_kraj,
        auk.aukcija_status,
        auk.aukcija_statusend,
        kat.kategorija_sifra,
        kat.kategorija_naziv,
        a.artefakt_naziv,
        a.artefakt_stanje,
        f.fotografija_podatak
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      LEFT JOIN PI2_proj_ARTEFAKT_FOTOGRAFIJA f
        ON f.fotografija_artefakt_sifra = a.artefakt_sifra
        AND f.fotografija_redni_broj = 1
      LEFT JOIN PI2_proj_KATEGORIJA kat
       ON a.artefakt_kategorija_sifra = kat.kategorija_sifra
      WHERE (
        auk.aukcija_status IN ('ceka', 'prvi poziv', 'drugi poziv', 'zadnji poziv', 'zavrsena')
      )
      AND (
        auk.aukcija_statusend IS NULL
        OR auk.aukcija_statusend <> 'ponistena'
      )
      ORDER BY auk.aukcija_kraj ASC
    `)

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja aukcija:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.get('/api/auctions/:id', async (req, res) => {
  const { id } = req.params

  try {
    await closeAuctionIfEnded(id)
    await updateAuctionStatus(id)

    const [rows] = await db.query(
      `
      SELECT
        kat.kategorija_sifra,
        kat.kategorija_naziv,
        auk.aukcija_sifra,
        auk.aukcija_naziv,
        auk.aukcija_cijena_pocetna,
        auk.aukcija_cijena_trenutna,
        auk.aukcija_cijena_rezervirana,
        auk.aukcija_pocetak,
        auk.aukcija_kraj,
        auk.aukcija_status,
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_marka,
        a.artefakt_model,
        a.artefakt_datum_proizvodnje,
        a.artefakt_stanje,
        a.artefakt_opis,
        k.korisnik_sifra AS prodavatelj_sifra,
        k.korisnik_username,
        ROUND(AVG(r.recenzija_ocjena), 1) AS prodavatelj_prosjecna_ocjena,
        COUNT(r.recenzija_sifra) AS prodavatelj_broj_recenzija,
        p.procjena_cijena_procijenjena
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      LEFT JOIN PI2_proj_KATEGORIJA kat
        ON a.artefakt_kategorija_sifra = kat.kategorija_sifra
      JOIN PI2_proj_KORISNIK k
        ON a.artefakt_korisnik_sifra = k.korisnik_sifra
      LEFT JOIN PI2_proj_RECENZIJA r
        ON r.recenzija_primatelj_sifra = a.artefakt_korisnik_sifra
      LEFT JOIN PI2_proj_PROCJENA p
        ON a.artefakt_procjena_sifra = p.procjena_sifra

      WHERE auk.aukcija_sifra = ?
     GROUP BY
      kat.kategorija_sifra,
      kat.kategorija_naziv,
      auk.aukcija_sifra,
      auk.aukcija_naziv,
      auk.aukcija_cijena_pocetna,
      auk.aukcija_cijena_trenutna,
      auk.aukcija_cijena_rezervirana,
      auk.aukcija_pocetak,
      auk.aukcija_kraj,
      auk.aukcija_status,
      a.artefakt_sifra,
      a.artefakt_naziv,
      a.artefakt_marka,
      a.artefakt_model,
      a.artefakt_datum_proizvodnje,
      a.artefakt_stanje,
      a.artefakt_opis,
      k.korisnik_username,
      p.procjena_cijena_procijenjena
      `,
      [id],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const [photos] = await db.query(
      `
      SELECT
        fotografija_podatak,
        fotografija_redni_broj
      FROM PI2_proj_ARTEFAKT_FOTOGRAFIJA
      WHERE fotografija_artefakt_sifra = ?
      ORDER BY fotografija_redni_broj ASC
      `,
      [rows[0].artefakt_sifra],
    )

    res.json({
      ...rows[0],
      fotografije: photos,
    })
  } catch (error) {
    console.error('Greška kod dohvaćanja detalja aukcije:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

const LAST_SECOND_WINDOW_MS = 60 * 1000
const AUCTION_EXTENSION_SECONDS = 120

function calculateBidStep(currentPrice) {
  return Math.max(5, Math.ceil(Number(currentPrice) * 0.05))
}

async function processAutobidsForAuction(auctionId) {
  const [leaderRows] = await db.query(
    `
    SELECT
      ponuda_korisnik_sifra,
      ponuda_cijena_ponudjena
    FROM PI2_proj_PONUDA
    WHERE ponuda_aukcija_sifra = ?
    ORDER BY ponuda_cijena_ponudjena DESC, ponuda_vrijeme DESC
    LIMIT 1
    `,
    [auctionId],
  )

  const currentLeader = leaderRows[0]

  if (!currentLeader) {
    return null
  }

  const currentPrice = Number(currentLeader.ponuda_cijena_ponudjena)

  const [autobids] = await db.query(
    `
    SELECT
      autobid_korisnik_sifra,
      autobid_maksimalni_iznos
    FROM PI2_proj_AUTOBID
    WHERE autobid_aukcija_sifra = ?
      AND autobid_aktivan = 'da'
      AND autobid_maksimalni_iznos > ?
    ORDER BY autobid_maksimalni_iznos DESC, autobid_vrijeme ASC
    `,
    [auctionId, currentPrice],
  )

  if (autobids.length === 0) {
    return null
  }

  const bestAutobid = autobids[0]
  const bestUserId = bestAutobid.autobid_korisnik_sifra
  const bestMaxAmount = Number(bestAutobid.autobid_maksimalni_iznos)

  const competingAmounts = [
    currentPrice,
    ...autobids
      .filter((autobid) => Number(autobid.autobid_korisnik_sifra) !== Number(bestUserId))
      .map((autobid) => Number(autobid.autobid_maksimalni_iznos)),
  ]

  const strongestCompetitorAmount = Math.max(...competingAmounts)
  const bidStep = calculateBidStep(strongestCompetitorAmount)

  const autobidPrice = Math.min(bestMaxAmount, strongestCompetitorAmount + bidStep)

  if (autobidPrice <= currentPrice) {
    return null
  }

  const [lastBids] = await db.query(
    `
    SELECT COUNT(*) AS broj_ponuda
    FROM PI2_proj_PONUDA
    WHERE ponuda_aukcija_sifra = ?
    `,
    [auctionId],
  )

  const nextBidNumber = lastBids[0].broj_ponuda + 1

  await db.query(
    `
    INSERT INTO PI2_proj_PONUDA (
      ponuda_rednibroj,
      ponuda_vrijeme,
      ponuda_cijena_ponudjena,
      ponuda_korisnik_sifra,
      ponuda_aukcija_sifra
    )
    VALUES (?, NOW(), ?, ?, ?)
    `,
    [String(nextBidNumber), autobidPrice, bestUserId, auctionId],
  )

  await db.query(
    `
    UPDATE PI2_proj_AUKCIJA
    SET aukcija_cijena_trenutna = ?
    WHERE aukcija_sifra = ?
    `,
    [autobidPrice, auctionId],
  )

  if (Number(currentLeader.ponuda_korisnik_sifra) !== Number(bestUserId)) {
    await db.query(
      `
      INSERT INTO PI2_proj_OBAVIJEST (
        obavijest_vrijeme,
        obavijest_naslov,
        obavijest_tekst,
        obavijest_korisnik_sifra,
        obavijest_aukcija_sifra
      )
      VALUES (NOW(), ?, ?, ?, ?)
      `,
      [
        'Nadmašeni ste',
        'Vaša ponuda je automatski nadmašena autobidom drugog korisnika.',
        currentLeader.ponuda_korisnik_sifra,
        auctionId,
      ],
    )

    io.emit('notification-created', {
      userId: currentLeader.ponuda_korisnik_sifra,
    })
  }

  return {
    userId: bestUserId,
    price: autobidPrice,
  }
}

app.post('/api/auctions/:id/autobid', verifyToken, async (req, res) => {
  const { id } = req.params
  const userId = req.user.korisnik_sifra
  const { maksimalniIznos } = req.body

  try {
    const maxAmount = Number(maksimalniIznos)

    if (!maxAmount || maxAmount <= 0) {
      return res.status(400).json({
        message: 'Maksimalni iznos autobida mora biti veći od 0.',
      })
    }

    const [auctions] = await db.query(
      `
      SELECT
        auk.aukcija_sifra,
        auk.aukcija_cijena_trenutna,
        auk.aukcija_status,
        auk.aukcija_statusend,
        a.artefakt_korisnik_sifra
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      WHERE auk.aukcija_sifra = ?
      `,
      [id],
    )

    if (auctions.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = auctions[0]

    if (Number(auction.artefakt_korisnik_sifra) === Number(userId)) {
      return res.status(400).json({
        message: 'Ne možete postaviti autobid na vlastiti artefakt.',
      })
    }

    if (auction.aukcija_statusend === 'ponistena' || auction.aukcija_status === 'zavrsena') {
      return res.status(400).json({
        message: 'Autobid nije moguće postaviti na završenu ili poništenu aukciju.',
      })
    }

    if (maxAmount <= Number(auction.aukcija_cijena_trenutna)) {
      return res.status(400).json({
        message: 'Maksimalni iznos mora biti veći od trenutne cijene.',
      })
    }

    await db.query(
      `
      INSERT INTO PI2_proj_AUTOBID (
        autobid_aukcija_sifra,
        autobid_korisnik_sifra,
        autobid_maksimalni_iznos,
        autobid_aktivan
      )
      VALUES (?, ?, ?, 'da')
      ON DUPLICATE KEY UPDATE
        autobid_maksimalni_iznos = VALUES(autobid_maksimalni_iznos),
        autobid_aktivan = 'da',
        autobid_vrijeme = CURRENT_TIMESTAMP
      `,
      [id, userId, maxAmount],
    )

    const autobidResult = await processAutobidsForAuction(id)

    if (autobidResult) {
      io.emit('bid-updated', {
        auctionId: id,
        newPrice: autobidResult.price,
      })
    }

    res.json({
      message: 'Autobid je spremljen.',
    })
  } catch (error) {
    console.error('Greška kod spremanja autobida:', error)

    res.status(500).json({
      message: 'Greška kod spremanja autobida.',
    })
  }
})

app.get('/api/auctions/:id/autobid/my', verifyToken, async (req, res) => {
  const { id } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        autobid_sifra,
        autobid_maksimalni_iznos,
        autobid_aktivan
      FROM PI2_proj_AUTOBID
      WHERE autobid_aukcija_sifra = ?
        AND autobid_korisnik_sifra = ?
        AND autobid_aktivan = 'da'
      LIMIT 1
      `,
      [id, userId],
    )

    res.json(rows[0] || null)
  } catch (error) {
    console.error('Greška kod dohvaćanja autobida:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja autobida.',
    })
  }
})

app.post('/api/auctions/:id/bids', verifyToken, async (req, res) => {
  const { id } = req.params
  const userId = req.user.korisnik_sifra
  const { ponuda_cijena_ponudjena } = req.body

  try {
    await updateAuctionStatus(id)

    const [auctions] = await db.query(
      `
      SELECT
        auk.aukcija_sifra,
        aukcija_naziv,
        auk.aukcija_cijena_trenutna,
        auk.aukcija_status,
        auk.aukcija_statusend,
        auk.aukcija_kraj,
        a.artefakt_korisnik_sifra
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
      ON auk.aukcija_artefakt_sifra = a. artefakt_sifra
      WHERE auk.aukcija_sifra = ?
      `,
      [id],
    )

    if (auctions.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = auctions[0]

    if (auction.aukcija_statusend === 'ponistena') {
      return res.status(400).json({
        message: 'Aukcija je poništena. Nije moguće dati novu ponudu.',
      })
    }

    if (Number(auction.artefakt_korisnik_sifra) === Number(userId)) {
      return res.status(400).json({
        message: 'Ne možete licitirati na vlastiti artefakt.',
      })
    }

    if (new Date(auction.aukcija_kraj) <= new Date()) {
      return res.status(400).json({
        message: 'Aukcija je završena.',
      })
    }
    if (!['ceka', 'prvi poziv', 'drugi poziv', 'zadnji poziv'].includes(auction.aukcija_status)) {
      return res.status(400).json({
        message: 'Aukcija nije otvorena za ponude.',
      })
    }

    const currentPrice = Number(auction.aukcija_cijena_trenutna)
    const bidPrice = Number(ponuda_cijena_ponudjena)

    if (!bidPrice || bidPrice <= currentPrice) {
      return res.status(400).json({
        message: 'Ponuda mora biti veća od trenutne cijene.',
      })
    }

    const [currentLeaderRows] = await db.query(
      `
  SELECT
    ponuda_korisnik_sifra,
    ponuda_cijena_ponudjena
  FROM PI2_proj_PONUDA
  WHERE ponuda_aukcija_sifra = ?
  ORDER BY ponuda_cijena_ponudjena DESC, ponuda_vrijeme DESC
  LIMIT 1
  `,
      [id],
    )

    const currentLeader = currentLeaderRows[0]

    const [lastBids] = await db.query(
      `
      SELECT COUNT(*) AS broj_ponuda
      FROM PI2_proj_PONUDA
      WHERE ponuda_aukcija_sifra = ?
      `,
      [id],
    )

    const nextBidNumber = lastBids[0].broj_ponuda + 1

    await db.query(
      `
      INSERT INTO PI2_proj_PONUDA (
        ponuda_rednibroj,
        ponuda_vrijeme,
        ponuda_cijena_ponudjena,
        ponuda_korisnik_sifra,
        ponuda_aukcija_sifra
      )
      VALUES (?, NOW(), ?, ?, ?)
      `,
      [String(nextBidNumber), bidPrice, userId, id],
    )

    if (currentLeader && Number(currentLeader.ponuda_korisnik_sifra) !== Number(userId)) {
      await db.query(
        `
    INSERT INTO PI2_proj_OBAVIJEST (
      obavijest_vrijeme,
      obavijest_naslov,
      obavijest_tekst,
      obavijest_korisnik_sifra,
      obavijest_aukcija_sifra
    )

    VALUES (NOW(), ?, ?, ?, ?)
    `,
        [
          'Nadmašeni ste',
          `Netko je dao višu ponudu na aukciji "${auction.aukcija_naziv}".`,
          currentLeader.ponuda_korisnik_sifra,
          id,
        ],
      )
      io.emit('notification-created', {
        userId: currentLeader.ponuda_korisnik_sifra,
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_cijena_trenutna = ?
      WHERE aukcija_sifra = ?
      `,
      [bidPrice, id],
    )

    await processAutobidsForAuction(id)

    const remainingTime = new Date(auction.aukcija_kraj) - new Date()

    if (remainingTime <= LAST_SECOND_WINDOW_MS) {
      console.log(`Aukcija ${id} produžena za ${AUCTION_EXTENSION_SECONDS} sekundi.`)
      await db.query(
        `
    UPDATE PI2_proj_AUKCIJA
    SET aukcija_kraj = DATE_ADD(aukcija_kraj, INTERVAL ? SECOND)
    WHERE aukcija_sifra = ?
    `,
        [AUCTION_EXTENSION_SECONDS, id],
      )
    }

    io.emit('bid-updated', {
      auctionId: id,
      newPrice: bidPrice,
    })

    res.json({
      message: 'Ponuda je uspješno spremljena.',
      nova_cijena: bidPrice,
    })
  } catch (error) {
    console.error('Greška kod spremanja ponude:', error)

    res.status(500).json({
      message: 'Greška na serveru.',
    })
  }
})

app.get('/api/auctions/:id/bids', async (req, res) => {
  const { id } = req.params

  try {
    const [bids] = await db.query(
      `
      SELECT
        ponuda_sifra,
        ponuda_vrijeme,
        ponuda_cijena_ponudjena,
        ponuda_korisnik_sifra
      FROM PI2_proj_PONUDA
      WHERE ponuda_aukcija_sifra = ?
      ORDER BY ponuda_vrijeme DESC
      `,
      [id],
    )

    res.json(bids)
  } catch (error) {
    console.error('Greška kod dohvaćanja ponuda:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja ponuda.',
    })
  }
})

app.get('/api/user/my-auctions', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        auk.aukcija_sifra,
        auk.aukcija_naziv,
        auk.aukcija_cijena_trenutna,
        auk.aukcija_kraj,
        auk.aukcija_status,
        auk.aukcija_statusend,
        auk.aukcija_cijena_konacna,
        auk.aukcija_ugovor,
        auk.aukcija_ugovor_datum,
        auk.aukcija_ugovor_kupac_prihvatio,
        auk.aukcija_ugovor_prodavatelj_prihvatio,
        auk.aukcija_kupac_uplatio,
        auk.aukcija_ugovor_potvrdaplacanja,
        auk.aukcija_ugovor_potvrdaisporuke,
        auk.aukcija_kupac_preuzeo,
        auk.aukcija_ugovor_artefaktodgovara,
        a.artefakt_korisnik_sifra AS prodavatelj_sifra,
        p.ponuda_korisnik_sifra AS kupac_sifra,
        rec.recenzija_sifra AS moja_recenzija_sifra,
        MAX(p.ponuda_cijena_ponudjena) AS moja_najvisa_ponuda,
        sys.recenzija_sustava_sifra AS moja_recenzija_sustava_sifra
      FROM PI2_proj_PONUDA p
      JOIN PI2_proj_AUKCIJA auk
        ON p.ponuda_aukcija_sifra = auk.aukcija_sifra
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      LEFT JOIN PI2_proj_RECENZIJA rec
        ON rec.recenzija_aukcija_sifra = auk.aukcija_sifra
        AND rec.recenzija_davatelj_sifra = p.ponuda_korisnik_sifra
      LEFT JOIN PI2_proj_RECENZIJA_SUSTAVA sys
        ON sys.recenzija_sustava_aukcija_sifra = auk.aukcija_sifra
        AND sys.recenzija_sustava_korisnik_sifra = ?
      WHERE p.ponuda_korisnik_sifra = ?
      GROUP BY
        auk.aukcija_sifra,
        auk.aukcija_naziv,
        auk.aukcija_cijena_trenutna,
        auk.aukcija_kraj,
        auk.aukcija_status,
        auk.aukcija_statusend,
        auk.aukcija_cijena_konacna,
        auk.aukcija_ugovor,
        auk.aukcija_ugovor_datum,
        auk.aukcija_ugovor_kupac_prihvatio,
        auk.aukcija_ugovor_prodavatelj_prihvatio,
        auk.aukcija_kupac_uplatio,
        auk.aukcija_ugovor_potvrdaplacanja,
        auk.aukcija_ugovor_potvrdaisporuke,
        auk.aukcija_kupac_preuzeo,
        auk.aukcija_ugovor_artefaktodgovara,
        p.ponuda_korisnik_sifra,
        p.ponuda_korisnik_sifra,
        a.artefakt_korisnik_sifra,
        rec.recenzija_sifra,
        sys.recenzija_sustava_sifra
      ORDER BY auk.aukcija_kraj ASC
      `,
      [userId, userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja korisnikovih aukcija:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja korisnikovih aukcija.',
    })
  }
})

async function updateAuctionStatus(auctionId) {
  const [rows] = await db.query(
    `
    SELECT
      aukcija_sifra,
      aukcija_pocetak,
      aukcija_kraj,
      aukcija_status,
      aukcija_statusend
    FROM PI2_proj_AUKCIJA
    WHERE aukcija_sifra = ?
    `,
    [auctionId],
  )

  if (rows.length === 0) {
    return null
  }

  const auction = rows[0]

  if (['ponistena', 'transakcija zavrsena', 'reklamacija'].includes(auction.aukcija_statusend)) {
    return auction.aukcija_status
  }

  const now = new Date()
  const start = new Date(auction.aukcija_pocetak)
  const end = new Date(auction.aukcija_kraj)

  const remainingMs = end - now

  let newStatus = auction.aukcija_status

  if (now < start) {
    newStatus = 'ceka'
  } else if (now >= end) {
    newStatus = 'zavrsena'
  } else if (remainingMs <= 60 * 1000) {
    newStatus = 'zadnji poziv'
  } else if (remainingMs <= 10 * 60 * 1000) {
    newStatus = 'drugi poziv'
  } else {
    newStatus = 'prvi poziv'
  }

  if (newStatus !== auction.aukcija_status) {
    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_status = ?
      WHERE aukcija_sifra = ?
      `,
      [newStatus, auctionId],
    )
  }

  return newStatus
}

async function createNotification(userId, title, text, auctionId = null) {
  await db.query(
    `
    INSERT INTO PI2_proj_OBAVIJEST (
      obavijest_vrijeme,
      obavijest_naslov,
      obavijest_tekst,
      obavijest_procitana,
      obavijest_korisnik_sifra,
      obavijest_aukcija_sifra
    )
    VALUES (NOW(), ?, ?, 'ne', ?, ?)
    `,
    [title, text, userId, auctionId],
  )
}

async function closeAuctionIfEnded(auctionId) {
  const [auctions] = await db.query(
    `
    SELECT
      aukcija_sifra,
      aukcija_kraj,
      aukcija_status,
      aukcija_statusend,
      a.artefakt_korisnik_sifra
    FROM PI2_proj_AUKCIJA auk
    JOIN PI2_proj_ARTEFAKT a
  ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
    WHERE aukcija_sifra = ?
    `,
    [auctionId],
  )

  if (auctions.length === 0) {
    return null
  }

  const auction = auctions[0]

  if (new Date(auction.aukcija_kraj) > new Date()) {
    return null
  }

  if (auction.aukcija_status === 'zavrsena' && auction.aukcija_statusend) {
    return null
  }

  const [bids] = await db.query(
    `
    SELECT
      ponuda_sifra,
      ponuda_cijena_ponudjena,
      ponuda_korisnik_sifra
    FROM PI2_proj_PONUDA
    WHERE ponuda_aukcija_sifra = ?
    ORDER BY ponuda_cijena_ponudjena DESC, ponuda_vrijeme ASC
    LIMIT 1
    `,
    [auctionId],
  )

  if (bids.length === 0) {
    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET
        aukcija_status = 'zavrsena',
        aukcija_statusend = 'bez ponuda'
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    return 'bez ponuda'
  }

  const winningBid = bids[0]

  const formattedPrice = Number(winningBid.ponuda_cijena_ponudjena).toLocaleString('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [otherBidders] = await db.query(
    `
  SELECT DISTINCT
    ponuda_korisnik_sifra
  FROM PI2_proj_PONUDA
  WHERE ponuda_aukcija_sifra = ?
    AND ponuda_korisnik_sifra <> ?
  `,
    [auctionId, winningBid.ponuda_korisnik_sifra],
  )
  await db.query(
    `
    UPDATE PI2_proj_AUKCIJA
    SET
      aukcija_status = 'zavrsena',
      aukcija_statusend = 'uspjesno zavrsena',
      aukcija_cijena_konacna = ?
    WHERE aukcija_sifra = ?
    `,
    [winningBid.ponuda_cijena_ponudjena, auctionId],
  )

  await createNotification(
    winningBid.ponuda_korisnik_sifra,
    'Pobijedili ste na aukciji',
    `Pobijedili ste na aukciji s ponudom od ${formattedPrice} €.`,
    auctionId,
  )

  await createNotification(
    auction.artefakt_korisnik_sifra,
    'Artefakt je prodan',
    `Vaš artefakt prodan je za ${formattedPrice} €.`,
    auctionId,
  )

  for (const bidder of otherBidders) {
    await createNotification(
      bidder.ponuda_korisnik_sifra,
      'Aukcija je završena',
      'Aukcija je završena. Niste imali najvišu ponudu.',
      auctionId,
    )
  }
  return 'uspjesno zavrsena'
}

app.get('/api/user/notifications', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [notifications] = await db.query(
      `
      SELECT
  o.obavijest_sifra,
  o.obavijest_vrijeme,
  o.obavijest_naslov,
  o.obavijest_tekst,
  o.obavijest_procitana,
  o.obavijest_aukcija_sifra,
  auk.aukcija_naziv
FROM PI2_proj_OBAVIJEST o
LEFT JOIN PI2_proj_AUKCIJA auk
  ON o.obavijest_aukcija_sifra = auk.aukcija_sifra
WHERE o.obavijest_korisnik_sifra = ?
ORDER BY o.obavijest_vrijeme DESC
      `,
      [userId],
    )

    res.json(notifications)
  } catch (error) {
    console.error('Greška kod dohvaćanja obavijesti:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja obavijesti.',
    })
  }
})

async function closeEndedAuctions() {
  try {
    const [auctions] = await db.query(
      `
      SELECT aukcija_sifra
      FROM PI2_proj_AUKCIJA
      WHERE aukcija_kraj <= NOW()
        AND (
          aukcija_status <> 'zavrsena'
          OR aukcija_statusend IS NULL
        )
      `,
    )

    for (const auction of auctions) {
      await closeAuctionIfEnded(auction.aukcija_sifra)

      io.emit('auction-closed', {
        auctionId: auction.aukcija_sifra,
      })
    }
  } catch (error) {
    console.error('Greška kod automatskog zatvaranja aukcija:', error)
  }
}
setInterval(() => {
  closeEndedAuctions()
}, 10000)

app.put('/api/user/auctions/:auctionId/accept-contract', verifyToken, async (req, res) => {
  const { auctionId } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        auk.aukcija_sifra,
        auk.aukcija_ugovor,
        auk.aukcija_ugovor_kupac_prihvatio,
        auk.aukcija_ugovor_prodavatelj_prihvatio,
        a.artefakt_korisnik_sifra,
        p.ponuda_korisnik_sifra AS kupac_sifra
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      JOIN PI2_proj_PONUDA p
        ON p.ponuda_aukcija_sifra = auk.aukcija_sifra
        AND p.ponuda_cijena_ponudjena = auk.aukcija_cijena_konacna
      WHERE auk.aukcija_sifra = ?
      `,
      [auctionId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = rows[0]

    if (!auction.aukcija_ugovor) {
      return res.status(400).json({
        message: 'Ugovor još nije generiran.',
      })
    }

    if (Number(userId) === Number(auction.kupac_sifra)) {
      await db.query(
        `
        UPDATE PI2_proj_AUKCIJA
        SET aukcija_ugovor_kupac_prihvatio = 'da'
        WHERE aukcija_sifra = ?
        `,
        [auctionId],
      )

      return res.json({
        message: 'Prihvatili ste ugovor kao kupac.',
      })
    }

    if (Number(userId) === Number(auction.artefakt_korisnik_sifra)) {
      await db.query(
        `
        UPDATE PI2_proj_AUKCIJA
        SET aukcija_ugovor_prodavatelj_prihvatio = 'da'
        WHERE aukcija_sifra = ?
        `,
        [auctionId],
      )

      return res.json({
        message: 'Prihvatili ste ugovor kao prodavatelj.',
      })
    }

    return res.status(403).json({
      message: 'Nemate ovlasti prihvatiti ovaj ugovor.',
    })
  } catch (error) {
    console.error('Greška kod prihvata ugovora:', error)

    res.status(500).json({
      message: 'Greška kod prihvata ugovora.',
    })
  }
})

app.put('/api/user/auctions/:auctionId/confirm-payment', verifyToken, async (req, res) => {
  const { auctionId } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        auk.aukcija_sifra,
        auk.aukcija_ugovor,
        auk.aukcija_ugovor_kupac_prihvatio,
        auk.aukcija_ugovor_prodavatelj_prihvatio,
        p.ponuda_korisnik_sifra AS kupac_sifra
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_PONUDA p
        ON p.ponuda_aukcija_sifra = auk.aukcija_sifra
        AND p.ponuda_cijena_ponudjena = auk.aukcija_cijena_konacna
      WHERE auk.aukcija_sifra = ?
      `,
      [auctionId],
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Aukcija nije pronađena.' })
    }

    const auction = rows[0]

    if (Number(userId) !== Number(auction.kupac_sifra)) {
      return res.status(403).json({
        message: 'Samo kupac može potvrditi uplatu.',
      })
    }

    if (
      auction.aukcija_ugovor_kupac_prihvatio !== 'da' ||
      auction.aukcija_ugovor_prodavatelj_prihvatio !== 'da'
    ) {
      return res.status(400).json({
        message: 'Ugovor moraju prihvatiti obje strane prije potvrde uplate.',
      })
    }

    await db.query(
      `
  UPDATE PI2_proj_AUKCIJA
  SET aukcija_kupac_uplatio = 'uplatio'
  WHERE aukcija_sifra = ?
  `,
      [auctionId],
    )

    res.json({ message: 'Kupac je potvrdio uplatu.' })
  } catch (error) {
    console.error('Greška kod potvrde uplate:', error)
    res.status(500).json({ message: 'Greška kod potvrde uplate.' })
  }
})

app.put('/api/user/auctions/:auctionId/confirm-received-payment', verifyToken, async (req, res) => {
  const { auctionId } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_korisnik_sifra,
        auk.aukcija_kupac_uplatio
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      WHERE auk.aukcija_sifra = ?
      `,
      [auctionId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = rows[0]

    if (Number(userId) !== Number(auction.artefakt_korisnik_sifra)) {
      return res.status(403).json({
        message: 'Samo prodavatelj može potvrditi primitak uplate.',
      })
    }

    if (auction.aukcija_kupac_uplatio !== 'uplatio') {
      return res.status(400).json({
        message: 'Kupac još nije potvrdio uplatu.',
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_ugovor_potvrdaplacanja = 'placeno'
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    res.json({
      message: 'Primitak uplate je potvrđen.',
    })
  } catch (error) {
    console.error('Greška kod potvrde primitka uplate:', error)

    res.status(500).json({
      message: 'Greška kod potvrde primitka uplate.',
    })
  }
})

app.put('/api/user/auctions/:auctionId/confirm-delivery', verifyToken, async (req, res) => {
  const { auctionId } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_korisnik_sifra,
        auk.aukcija_ugovor_potvrdaplacanja
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_ARTEFAKT a
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      WHERE auk.aukcija_sifra = ?
      `,
      [auctionId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = rows[0]

    if (Number(userId) !== Number(auction.artefakt_korisnik_sifra)) {
      return res.status(403).json({
        message: 'Samo prodavatelj može potvrditi isporuku.',
      })
    }

    if (auction.aukcija_ugovor_potvrdaplacanja !== 'placeno') {
      return res.status(400).json({
        message: 'Isporuka se može potvrditi tek nakon potvrđene uplate.',
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_ugovor_potvrdaisporuke = 'isporuceno'
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    res.json({
      message: 'Isporuka je potvrđena.',
    })
  } catch (error) {
    console.error('Greška kod potvrde isporuke:', error)

    res.status(500).json({
      message: 'Greška kod potvrde isporuke.',
    })
  }
})

app.put('/api/user/auctions/:auctionId/confirm-receipt', verifyToken, async (req, res) => {
  const { auctionId } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        auk.aukcija_ugovor_potvrdaisporuke,
        p.ponuda_korisnik_sifra AS kupac_sifra
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_PONUDA p
        ON p.ponuda_aukcija_sifra = auk.aukcija_sifra
        AND p.ponuda_cijena_ponudjena = auk.aukcija_cijena_konacna
      WHERE auk.aukcija_sifra = ?
      `,
      [auctionId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = rows[0]

    if (Number(userId) !== Number(auction.kupac_sifra)) {
      return res.status(403).json({
        message: 'Samo kupac može potvrditi primitak artefakta.',
      })
    }

    if (auction.aukcija_ugovor_potvrdaisporuke !== 'isporuceno') {
      return res.status(400).json({
        message: 'Artefakt još nije označen kao isporučen.',
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_kupac_preuzeo = 'preuzeo'
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    res.json({
      message: 'Primitak artefakta je potvrđen.',
    })
  } catch (error) {
    console.error('Greška kod potvrde primitka artefakta:', error)

    res.status(500).json({
      message: 'Greška kod potvrde primitka artefakta.',
    })
  }
})

app.put(
  '/api/user/auctions/:auctionId/confirm-artifact-condition',
  verifyToken,
  async (req, res) => {
    const { auctionId } = req.params
    const userId = req.user.korisnik_sifra
    const { artefaktOdgovara } = req.body

    try {
      if (!['odgovara opisu', 'ne odgovara opisu'].includes(artefaktOdgovara)) {
        return res.status(400).json({
          message: 'Neispravna vrijednost potvrde artefakta.',
        })
      }

      const [rows] = await db.query(
        `
      SELECT
        auk.aukcija_kupac_preuzeo,
        p.ponuda_korisnik_sifra AS kupac_sifra
      FROM PI2_proj_AUKCIJA auk
      JOIN PI2_proj_PONUDA p
        ON p.ponuda_aukcija_sifra = auk.aukcija_sifra
        AND p.ponuda_cijena_ponudjena = auk.aukcija_cijena_konacna
      WHERE auk.aukcija_sifra = ?
      `,
        [auctionId],
      )

      if (rows.length === 0) {
        return res.status(404).json({
          message: 'Aukcija nije pronađena.',
        })
      }

      const auction = rows[0]

      if (Number(userId) !== Number(auction.kupac_sifra)) {
        return res.status(403).json({
          message: 'Samo kupac može potvrditi stanje artefakta.',
        })
      }

      if (auction.aukcija_kupac_preuzeo !== 'preuzeo') {
        return res.status(400).json({
          message: 'Prvo je potrebno potvrditi primitak artefakta.',
        })
      }

      await db.query(
        `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_ugovor_artefaktodgovara = ?
      WHERE aukcija_sifra = ?
      `,
        [artefaktOdgovara, auctionId],
      )

      res.json({
        message: 'Stanje artefakta je potvrđeno.',
      })
    } catch (error) {
      console.error('Greška kod potvrde stanja artefakta:', error)

      res.status(500).json({
        message: 'Greška kod potvrde stanja artefakta.',
      })
    }
  },
)

app.put('/api/manager/auctions/:auctionId/complete', verifyToken, async (req, res) => {
  const { auctionId } = req.params

  try {
    const [rows] = await db.query(
      `
      SELECT
        aukcija_kupac_uplatio,
        aukcija_ugovor_potvrdaplacanja,
        aukcija_ugovor_potvrdaisporuke,
        aukcija_kupac_preuzeo,
        aukcija_ugovor_artefaktodgovara
      FROM PI2_proj_AUKCIJA
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Aukcija nije pronađena.',
      })
    }

    const auction = rows[0]

    if (
      auction.aukcija_kupac_uplatio !== 'uplatio' ||
      auction.aukcija_ugovor_potvrdaplacanja !== 'placeno' ||
      auction.aukcija_ugovor_potvrdaisporuke !== 'isporuceno' ||
      auction.aukcija_kupac_preuzeo !== 'preuzeo' ||
      auction.aukcija_ugovor_artefaktodgovara !== 'odgovara opisu'
    ) {
      return res.status(400).json({
        message: 'Transakcija još nije spremna za zaključenje.',
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_AUKCIJA
      SET aukcija_statusend = 'transakcija zavrsena'
      WHERE aukcija_sifra = ?
      `,
      [auctionId],
    )

    res.json({
      message: 'Transakcija uspješno zaključena.',
    })
  } catch (error) {
    console.error('Greška kod zaključenja transakcije:', error)

    res.status(500).json({
      message: 'Greška kod zaključenja transakcije.',
    })
  }
})

app.post('/api/reviews', verifyToken, async (req, res) => {
  const davateljSifra = req.user.korisnik_sifra

  const { aukcijaSifra, primateljSifra, ocjena, komentar } = req.body

  try {
    await db.query(
      `
      INSERT INTO PI2_proj_RECENZIJA (
        recenzija_ocjena,
        recenzija_komentar,
        recenzija_korisnik_sifra,
        recenzija_aukcija_sifra,
        recenzija_davatelj_sifra,
        recenzija_primatelj_sifra
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [ocjena, komentar, primateljSifra, aukcijaSifra, davateljSifra, primateljSifra],
    )

    res.json({
      message: 'Recenzija spremljena.',
    })
  } catch (error) {
    console.error('Greška kod spremanja recenzije:', error)

    res.status(500).json({
      message: 'Greška kod spremanja recenzije.',
    })
  }
})

app.get('/api/users/:userId/reviews', async (req, res) => {
  const { userId } = req.params

  try {
    const [rows] = await db.query(
      `
      SELECT
        r.recenzija_sifra,
        r.recenzija_ocjena,
        r.recenzija_komentar,
        r.recenzija_datum,
        auk.aukcija_naziv,
        dav.korisnik_username AS davatelj_username
      FROM PI2_proj_RECENZIJA r
      LEFT JOIN PI2_proj_AUKCIJA auk
        ON r.recenzija_aukcija_sifra = auk.aukcija_sifra
      LEFT JOIN PI2_proj_KORISNIK dav
        ON r.recenzija_davatelj_sifra = dav.korisnik_sifra
      WHERE r.recenzija_primatelj_sifra = ?
      ORDER BY r.recenzija_datum DESC
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja recenzija:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja recenzija.',
    })
  }
})

app.get('/api/user/my-reviews', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        r.recenzija_sifra,
        r.recenzija_ocjena,
        r.recenzija_komentar,
        r.recenzija_datum,
        auk.aukcija_naziv,
        dav.korisnik_username AS davatelj_username
      FROM PI2_proj_RECENZIJA r
      LEFT JOIN PI2_proj_AUKCIJA auk
        ON r.recenzija_aukcija_sifra = auk.aukcija_sifra
      LEFT JOIN PI2_proj_KORISNIK dav
        ON r.recenzija_davatelj_sifra = dav.korisnik_sifra
      WHERE r.recenzija_primatelj_sifra = ?
      ORDER BY r.recenzija_datum DESC
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja mojih recenzija:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja mojih recenzija.',
    })
  }
})

app.post('/api/system-reviews', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra
  const { ocjena, komentar, aukcijaSifra } = req.body

  try {
    if (!ocjena || Number(ocjena) < 1 || Number(ocjena) > 5) {
      return res.status(400).json({
        message: 'Ocjena mora biti između 1 i 5.',
      })
    }

    if (!aukcijaSifra) {
      return res.status(400).json({
        message: 'Nedostaje šifra aukcije.',
      })
    }

    const [existing] = await db.query(
      `
      SELECT recenzija_sustava_sifra
      FROM PI2_proj_RECENZIJA_SUSTAVA
      WHERE recenzija_sustava_korisnik_sifra = ?
        AND recenzija_sustava_aukcija_sifra = ?
      `,
      [userId, aukcijaSifra],
    )

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Već ste ocijenili sustav za ovu transakciju.',
      })
    }

    await db.query(
      `
      INSERT INTO PI2_proj_RECENZIJA_SUSTAVA (
        recenzija_sustava_ocjena,
        recenzija_sustava_komentar,
        recenzija_sustava_korisnik_sifra,
        recenzija_sustava_aukcija_sifra
      )
      VALUES (?, ?, ?, ?)
      `,
      [ocjena, komentar || null, userId, aukcijaSifra],
    )

    res.json({
      message: 'Recenzija sustava je spremljena.',
    })
  } catch (error) {
    console.error('Greška kod spremanja recenzije sustava:', error)

    res.status(500).json({
      message: 'Greška kod spremanja recenzije sustava.',
    })
  }
})

app.get('/api/system-reviews', async (req, res) => {
  try {
    const [summaryRows] = await db.query(
      `
      SELECT
        ROUND(AVG(recenzija_sustava_ocjena), 1) AS prosjecna_ocjena,
        COUNT(recenzija_sustava_sifra) AS broj_recenzija
      FROM PI2_proj_RECENZIJA_SUSTAVA
      `,
    )

    const [reviews] = await db.query(
      `
      SELECT
        r.recenzija_sustava_sifra,
        r.recenzija_sustava_ocjena,
        r.recenzija_sustava_komentar,
        r.recenzija_sustava_datum,
        k.korisnik_username
      FROM PI2_proj_RECENZIJA_SUSTAVA r
      LEFT JOIN PI2_proj_KORISNIK k
        ON r.recenzija_sustava_korisnik_sifra = k.korisnik_sifra
      ORDER BY r.recenzija_sustava_datum DESC
      `,
    )

    res.json({
      summary: summaryRows[0],
      reviews,
    })
  } catch (error) {
    console.error('Greška kod dohvaćanja recenzija sustava:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja recenzija sustava.',
    })
  }
})

app.put('/api/user/artifacts/:artifactId/withdraw', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const userId = req.user.korisnik_sifra

  try {
    const [artifacts] = await db.query(
      `
      SELECT
        artefakt_sifra,
        artefakt_korisnik_sifra,
        artefakt_povucen,
        artefakt_prodan,
        artefakt_zahtjev_povlacenje
      FROM PI2_proj_ARTEFAKT
      WHERE artefakt_sifra = ?
      `,
      [artifactId],
    )

    if (artifacts.length === 0) {
      return res.status(404).json({
        message: 'Artefakt nije pronađen.',
      })
    }

    const artifact = artifacts[0]

    if (Number(artifact.artefakt_korisnik_sifra) !== Number(userId)) {
      return res.status(403).json({
        message: 'Možete povući samo vlastiti artefakt.',
      })
    }

    if (artifact.artefakt_prodan === 'prodan') {
      return res.status(400).json({
        message: 'Prodani artefakt nije moguće povući.',
      })
    }

    if (artifact.artefakt_povucen === 'povucen') {
      return res.status(400).json({
        message: 'Artefakt je već povučen.',
      })
    }

    const [auctions] = await db.query(
      `
      SELECT
        aukcija_sifra,
        aukcija_status,
        aukcija_statusend
      FROM PI2_proj_AUKCIJA
      WHERE aukcija_artefakt_sifra = ?
      ORDER BY aukcija_sifra DESC
      LIMIT 1
      `,
      [artifactId],
    )

    if (auctions.length === 0) {
      await db.query(
        `
        UPDATE PI2_proj_ARTEFAKT
        SET artefakt_povucen = 'povucen'
        WHERE artefakt_sifra = ?
        `,
        [artifactId],
      )

      return res.json({
        message: 'Artefakt je uspješno povučen.',
      })
    }

    const auction = auctions[0]

    if (['ceka', 'prvi poziv', 'drugi poziv', 'zadnji poziv'].includes(auction.aukcija_status)) {
      if (artifact.artefakt_zahtjev_povlacenje === 'da') {
        return res.status(400).json({
          message: 'Zahtjev za povlačenje već je poslan.',
        })
      }

      await db.query(
        `
        UPDATE PI2_proj_ARTEFAKT
        SET artefakt_zahtjev_povlacenje = 'da'
        WHERE artefakt_sifra = ?
        `,
        [artifactId],
      )

      return res.json({
        message: 'Zahtjev za povlačenje poslan je voditelju aukcije.',
      })
    }

    if (
      auction.aukcija_status === 'zavrsena' &&
      ['bez ponuda', 'ponistena'].includes(auction.aukcija_statusend)
    ) {
      await db.query(
        `
        UPDATE PI2_proj_ARTEFAKT
        SET artefakt_povucen = 'povucen'
        WHERE artefakt_sifra = ?
        `,
        [artifactId],
      )

      return res.json({
        message: 'Artefakt je uspješno povučen.',
      })
    }

    return res.status(400).json({
      message: 'Artefakt nije moguće povući nakon uspješno završene aukcije.',
    })
  } catch (error) {
    console.error('Greška kod povlačenja artefakta:', error)

    res.status(500).json({
      message: 'Greška kod povlačenja artefakta.',
    })
  }
})

app.get('/api/manager/withdrawal-requests', verifyToken, async (req, res) => {
  const managerId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_stanje,
        a.artefakt_zahtjev_povlacenje,
        auk.aukcija_sifra,
        auk.aukcija_naziv,
        auk.aukcija_status,
        auk.aukcija_statusend,
        prod.korisnik_username AS prodavatelj_username
      FROM PI2_proj_ARTEFAKT a
      JOIN PI2_proj_KORISNIK prod
        ON a.artefakt_korisnik_sifra = prod.korisnik_sifra
      LEFT JOIN PI2_proj_AUKCIJA auk
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      WHERE a.artefakt_voditelj_sifra = ?
        AND a.artefakt_zahtjev_povlacenje = 'da'
      ORDER BY a.artefakt_sifra DESC
      `,
      [managerId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja zahtjeva za povlačenje:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja zahtjeva za povlačenje.',
    })
  }
})

app.put('/api/manager/withdrawal-requests/:artifactId/approve', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const managerId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.artefakt_sifra,
        a.artefakt_naziv,
        a.artefakt_voditelj_sifra,
        a.artefakt_korisnik_sifra,
        a.artefakt_zahtjev_povlacenje,
        auk.aukcija_sifra
      FROM PI2_proj_ARTEFAKT a
      LEFT JOIN PI2_proj_AUKCIJA auk
        ON auk.aukcija_artefakt_sifra = a.artefakt_sifra
      WHERE a.artefakt_sifra = ?
      ORDER BY auk.aukcija_sifra DESC
      LIMIT 1
      `,
      [artifactId],
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Artefakt nije pronađen.' })
    }

    const artifact = rows[0]

    if (Number(artifact.artefakt_voditelj_sifra) !== Number(managerId)) {
      return res.status(403).json({
        message: 'Samo dodijeljeni voditelj može odobriti povlačenje.',
      })
    }

    if (artifact.artefakt_zahtjev_povlacenje !== 'da') {
      return res.status(400).json({
        message: 'Za ovaj artefakt ne postoji zahtjev za povlačenje.',
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET
        artefakt_povucen = 'povucen',
        artefakt_zahtjev_povlacenje = 'ne'
      WHERE artefakt_sifra = ?
      `,
      [artifactId],
    )
    const [participants] = await db.query(
      `
  SELECT DISTINCT ponuda_korisnik_sifra
  FROM PI2_proj_PONUDA
  WHERE ponuda_aukcija_sifra = ?
  `,
      [artifact.aukcija_sifra],
    )

    for (const participant of participants) {
      await db.query(
        `
    INSERT INTO PI2_proj_OBAVIJEST (
      obavijest_vrijeme,
      obavijest_naslov,
      obavijest_tekst,
      obavijest_korisnik_sifra,
      obavijest_aukcija_sifra
    )
    VALUES (NOW(), ?, ?, ?, ?)
    `,
        [
          'Aukcija je poništena',
          `Aukcija za artefakt "${artifact.artefakt_naziv}" poništena je na zahtjev prodavatelja.`,
          participant.ponuda_korisnik_sifra,
          artifact.aukcija_sifra,
        ],
      )
    }

    await db.query(
      `
  INSERT INTO PI2_proj_OBAVIJEST (
    obavijest_vrijeme,
    obavijest_naslov,
    obavijest_tekst,
    obavijest_korisnik_sifra,
    obavijest_aukcija_sifra
  )
  VALUES (NOW(), ?, ?, ?, ?)
  `,
      [
        'Zahtjev za povlačenje odobren',
        `Vaš zahtjev za povlačenje artefakta "${artifact.artefakt_naziv}" je odobren.`,
        artifact.artefakt_korisnik_sifra,
        artifact.aukcija_sifra,
      ],
    )

    if (artifact.aukcija_sifra) {
      await db.query(
        `
        UPDATE PI2_proj_AUKCIJA
        SET
          aukcija_status = 'zavrsena',
          aukcija_statusend = 'ponistena'
        WHERE aukcija_sifra = ?
        `,
        [artifact.aukcija_sifra],
      )
    }

    res.json({
      message: 'Zahtjev za povlačenje je odobren.',
    })
  } catch (error) {
    console.error('Greška kod odobravanja povlačenja:', error)

    res.status(500).json({
      message: 'Greška kod odobravanja povlačenja.',
    })
  }
})

app.put('/api/manager/withdrawal-requests/:artifactId/reject', verifyToken, async (req, res) => {
  const { artifactId } = req.params
  const managerId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        artefakt_sifra,
        artefakt_naziv,
        artefakt_voditelj_sifra,
        artefakt_korisnik_sifra,
        artefakt_zahtjev_povlacenje
      FROM PI2_proj_ARTEFAKT
      WHERE artefakt_sifra = ?
      `,
      [artifactId],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Artefakt nije pronađen.',
      })
    }

    const artifact = rows[0]

    if (Number(artifact.artefakt_voditelj_sifra) !== Number(managerId)) {
      return res.status(403).json({
        message: 'Samo dodijeljeni voditelj može odbiti zahtjev za povlačenje.',
      })
    }

    if (artifact.artefakt_zahtjev_povlacenje !== 'da') {
      return res.status(400).json({
        message: 'Za ovaj artefakt ne postoji zahtjev za povlačenje.',
      })
    }

    await db.query(
      `
      UPDATE PI2_proj_ARTEFAKT
      SET artefakt_zahtjev_povlacenje = 'ne'
      WHERE artefakt_sifra = ?
      `,
      [artifactId],
    )

    await db.query(
      `
  INSERT INTO PI2_proj_OBAVIJEST (
    obavijest_vrijeme,
    obavijest_naslov,
    obavijest_tekst,
    obavijest_korisnik_sifra,
    obavijest_aukcija_sifra
  )
  VALUES (NOW(), ?, ?, ?, ?)
  `,
      [
        'Zahtjev za povlačenje odobren',
        `Vaš zahtjev za povlačenje artefakta "${artifact.artefakt_naziv}" je odobren.`,
        artifact.artefakt_korisnik_sifra,
        artifact.aukcija_sifra,
      ],
    )

    res.json({
      message: 'Zahtjev za povlačenje je odbijen.',
    })
  } catch (error) {
    console.error('Greška kod odbijanja povlačenja:', error)

    res.status(500).json({
      message: 'Greška kod odbijanja povlačenja.',
    })
  }
})

app.get('/api/user/notifications/unread-count', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS unreadCount
      FROM PI2_proj_OBAVIJEST
      WHERE obavijest_korisnik_sifra = ?
        AND obavijest_procitana = 'ne'
      `,
      [userId],
    )

    res.json({
      unreadCount: rows[0].unreadCount,
    })
  } catch (error) {
    console.error('Greška kod dohvaćanja broja nepročitanih obavijesti:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja broja nepročitanih obavijesti.',
    })
  }
})
app.put('/api/user/notifications/:notificationId/read', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra
  const { notificationId } = req.params

  try {
    await db.query(
      `
      UPDATE PI2_proj_OBAVIJEST
      SET obavijest_procitana = 'da'
      WHERE obavijest_sifra = ?
        AND obavijest_korisnik_sifra = ?
      `,
      [notificationId, userId],
    )

    res.json({
      message: 'Obavijest je označena kao pročitana.',
    })
  } catch (error) {
    console.error('Greška kod označavanja obavijesti kao pročitane:', error)

    res.status(500).json({
      message: 'Greška kod označavanja obavijesti kao pročitane.',
    })
  }
})

app.get('/api/user/notifications/recent', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    const [rows] = await db.query(
      `
      SELECT
        obavijest_sifra,
        obavijest_vrijeme,
        obavijest_naslov,
        obavijest_tekst,
        obavijest_procitana
      FROM PI2_proj_OBAVIJEST
      WHERE obavijest_korisnik_sifra = ?
      ORDER BY obavijest_vrijeme DESC
      LIMIT 15
      `,
      [userId],
    )

    res.json(rows)
  } catch (error) {
    console.error('Greška kod dohvaćanja zadnjih obavijesti:', error)

    res.status(500).json({
      message: 'Greška kod dohvaćanja zadnjih obavijesti.',
    })
  }
})

app.put('/api/user/notifications/read-all', verifyToken, async (req, res) => {
  const userId = req.user.korisnik_sifra

  try {
    await db.query(
      `
      UPDATE PI2_proj_OBAVIJEST
      SET obavijest_procitana = 'da'
      WHERE obavijest_korisnik_sifra = ?
        AND obavijest_procitana = 'ne'
      `,
      [userId],
    )

    res.json({
      message: 'Sve obavijesti su označene kao pročitane.',
    })
  } catch (error) {
    console.error('Greška kod označavanja svih obavijesti kao pročitanih:', error)

    res.status(500).json({
      message: 'Greška kod označavanja svih obavijesti kao pročitanih.',
    })
  }
})

httpServer.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}.`)
})
