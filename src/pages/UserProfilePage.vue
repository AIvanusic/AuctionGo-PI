<template>
  <div class="q-pa-xl" style="background-color: #f9f6ef; min-height: 100vh">
    <div class="text-h4 text-dark text-weight-medium">Korisnički profil</div>

    <div v-if="user" class="q-mt-lg">
      <div><strong>Ime i prezime:</strong> {{ user.korisnik_ime }} {{ user.korisnik_prezime }}</div>
      <div><strong>Korisničko ime:</strong> {{ user.korisnik_username }}</div>
      <div><strong>Email:</strong> {{ user.korisnik_email }}</div>
      <div>
        <strong>Status verifikacije:</strong>
        <template v-if="user.korisnik_verificiran === 'da'"> Verificiran </template>
        <template v-else>
          Nije verificiran —
          <router-link to="/complete-profile" style="font-weight: bold; text-decoration: none">
            Dovršite profil
          </router-link>
        </template>
      </div>

      <div class="row q-gutter-md q-mb-lg">
        <q-btn
          color="primary"
          text-color="dark"
          label="Prijavite artefakt"
          no-caps
          unelevated
          rounded
          to="/submit-artifact"
          class="q-mt-lg"
        />
        <q-btn
          color="primary"
          text-color="dark"
          label="Pregled aukcija"
          no-caps
          rounded
          unelevated
          to="/auctions"
          class="q-mt-lg"
        />
      </div>
      <div class="q-mt-xl">
        <div class="text-h5 text-dark q-mb-md">Moji artefakti</div>

        <div v-if="artifacts.length === 0" class="text-dark">
          Još nemate prijavljenih artefakata.
        </div>

        <q-table
          v-if="artifacts.length > 0"
          :rows="artifacts"
          :columns="artifactColumns"
          row-key="artefakt_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[5, 10, 20, 50, 0]"
        >
          <template v-slot:body-cell-akcije="props">
            <q-td :props="props">
              <q-btn
                color="primary"
                label="Detalji"
                no-caps
                size="sm"
                @click="openAuction(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>

      <div class="q-mt-xl">
        <div class="text-h5 text-dark q-mb-md">Moje obavijesti</div>

        <q-table
          :rows="notifications"
          :columns="notificationColumns"
          row-key="obavijest_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 5 }"
        />
      </div>
      <div class="q-mt-xl">
        <div class="text-h5 text-dark q-mb-md">Aukcije na kojima sudjelujem</div>

        <q-table
          :rows="myAuctions"
          :columns="myAuctionColumns"
          row-key="aukcija_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-akcije="props">
            <q-td :props="props">
              <q-btn
                color="primary"
                label="Detalji"
                no-caps
                size="sm"
                @click="openAuction(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
    <div v-else class="q-mt-lg">Za pregled profila potrebno se prijaviti.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'
import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const user = JSON.parse(localStorage.getItem('auctiongo_user'))

const artifacts = ref([])

const artifactColumns = [
  {
    name: 'naziv',
    label: 'Naziv',
    field: 'artefakt_naziv',
    align: 'left',
  },
  {
    name: 'kategorija',
    label: 'Kategorija',
    field: 'kategorija_naziv',
    align: 'left',
  },
  {
    name: 'stanje',
    label: 'Stanje',
    field: 'artefakt_stanje',
    align: 'left',
  },
  {
    name: 'status',
    label: 'Status obrade',
    field: (row) => {
      if (row.artefakt_prodan === 'prodan') return 'Prodan'
      if (row.artefakt_povucen === 'povucen') return 'Povučen'
      if (row.artefakt_odbijen === 'odbijen') return 'Odbijen'
      if (row.artefakt_odobren === 'odobren') return 'Odobren'
      return 'Na čekanju procjene'
    },
    align: 'left',
    sortable: true,
  },
]

const myAuctions = ref([])

async function fetchMyAuctions() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/user/my-auctions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    myAuctions.value = response.data

    console.log('Moje aukcije:', myAuctions.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja mojih aukcija:', error)
  }
}

const myAuctionColumns = [
  {
    name: 'aukcija_naziv',
    label: 'Aukcija',
    field: 'aukcija_naziv',
    align: 'left',
    sortable: true,
  },
  {
    name: 'moja_najvisa_ponuda',
    label: 'Moja ponuda',
    field: 'moja_najvisa_ponuda',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'aukcija_cijena_trenutna',
    label: 'Trenutna cijena',
    field: 'aukcija_cijena_trenutna',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'aukcija_kraj',
    label: 'Završava za',
    field: 'aukcija_kraj',
    format: (val) => formatTimeLeft(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: (row) => getAuctionStatus(row),
    align: 'center',
    sortable: true,
  },
  {
    name: 'akcije',
    label: 'Detalji',
    field: 'akcije',
    align: 'center',
  },
]

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return (
    Number(value).toLocaleString('hr-HR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

function formatDateTime(value) {
  const date = new Date(value)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year}. ${hour}:${minute}`
}

function formatTimeLeft(value) {
  if (!value) {
    return '-'
  }

  const endDate = new Date(value)
  const now = new Date()
  const diff = endDate - now

  if (diff <= 0) {
    return 'Završena'
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${days}d ${hours}s ${minutes}m`
}

function getAuctionStatus(row) {
  const isEnded = new Date(row.aukcija_kraj) <= new Date()

  if (isEnded) {
    if (row.aukcija_statusend === 'bez ponuda') {
      return 'Bez ponuda'
    }

    if (Number(row.moja_najvisa_ponuda) === Number(row.aukcija_cijena_konacna)) {
      return 'Pobijedili ste'
    }

    return 'Aukcija završena'
  }

  if (Number(row.moja_najvisa_ponuda) === Number(row.aukcija_cijena_trenutna)) {
    return 'Vodite'
  }

  return 'Nadmašeni ste'
}

const socket = io('http://localhost:3000')

const router = useRouter()

function openAuction(auction) {
  router.push(`/auctiondetail/${auction.aukcija_sifra}`)
}

const notifications = ref([])
async function fetchNotifications() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/user/notifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    notifications.value = response.data

    console.log('Moje obavijesti:', notifications.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja obavijesti:', error)
  }
}

const notificationColumns = [
  {
    name: 'vrijeme',
    label: 'Vrijeme',
    field: 'obavijest_vrijeme',
    format: (val) => formatDateTime(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'naslov',
    label: 'Naslov',
    field: 'obavijest_naslov',
    align: 'left',
    sortable: true,
  },
  {
    name: 'tekst',
    label: 'Obavijest',
    field: 'obavijest_tekst',
    align: 'left',
  },
]

onMounted(async () => {
  const token = localStorage.getItem('auctiongo_token')

  const response = await axios.get('http://localhost:3000/my-artifacts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  artifacts.value = response.data

  console.log(response.data)

  await fetchNotifications()
  await fetchMyAuctions()
})
socket.on('bid-updated', async () => {
  await fetchMyAuctions()
})

onUnmounted(() => {
  socket.off('bid-updated')
  socket.disconnect()
})
</script>
