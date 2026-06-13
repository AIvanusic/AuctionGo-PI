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
          <template v-slot:body-cell-aukcija="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.aukcija_sifra"
                color="primary"
                label="Aukcija"
                no-caps
                size="sm"
                @click="openAuction(props.row)"
              />

              <span v-else>-</span>
            </q-td>
          </template>
          <template v-slot:body-cell-ugovor="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.aukcija_ugovor"
                color="positive"
                label="Pregled ugovora"
                no-caps
                size="sm"
                flat
                @click="openContractDialog(props.row)"
              />

              <span v-else> - </span>
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
          <template v-slot:body-cell-ugovor="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.aukcija_ugovor"
                color="positive"
                label="Pregled ugovora"
                no-caps
                size="sm"
                flat
                @click="openContractDialog(props.row)"
              />
              <span v-else> - </span>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
    <div v-else class="q-mt-lg">Za pregled profila potrebno se prijaviti.</div>
  </div>
  <q-dialog v-model="contractDialog">
    <q-card style="min-width: 700px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Ugovor o kupoprodaji</div>
      </q-card-section>

      <q-card-section v-if="selectedContract">
        <p>
          <strong>Artefakt:</strong>
          {{ selectedContract.artefakt_naziv || selectedContract.aukcija_naziv }}
        </p>

        <p>
          <strong>Konačna cijena:</strong>
          {{ formatPrice(selectedContract.aukcija_cijena_konacna) }}
        </p>

        <p class="q-mt-md">
          Kupac se obvezuje platiti ugovoreni iznos, a prodavatelj isporučiti artefakt u stanju
          opisanom u aukciji.
        </p>

        <q-btn
          v-if="
            (Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
              selectedContract?.aukcija_ugovor_kupac_prihvatio !== 'da') ||
            (Number(user.korisnik_sifra) === Number(selectedContract?.prodavatelj_sifra) &&
              selectedContract?.aukcija_ugovor_prodavatelj_prihvatio !== 'da')
          "
          color="primary"
          label="Prihvatite ugovor"
          no-caps
          @click="acceptContract"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_ugovor_kupac_prihvatio === 'da' &&
            selectedContract?.aukcija_ugovor_prodavatelj_prihvatio === 'da' &&
            selectedContract?.aukcija_kupac_uplatio !== 'uplatio'
          "
          color="primary"
          label="Potvrdite uplatu"
          no-caps
          @click="confirmPayment(selectedContract)"
        />

        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.prodavatelj_sifra) &&
            selectedContract?.aukcija_kupac_uplatio === 'uplatio' &&
            selectedContract?.aukcija_ugovor_potvrdaplacanja !== 'placeno'
          "
          color="primary"
          label="Potvrdite primitak uplate"
          no-caps
          @click="confirmReceivedPayment(selectedContract)"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.prodavatelj_sifra) &&
            selectedContract?.aukcija_ugovor_potvrdaplacanja === 'placeno' &&
            selectedContract?.aukcija_ugovor_potvrdaisporuke !== 'isporuceno'
          "
          color="primary"
          label="Potvrdite isporuku"
          no-caps
          @click="confirmDelivery(selectedContract)"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_ugovor_potvrdaisporuke === 'isporuceno' &&
            selectedContract?.aukcija_kupac_preuzeo !== 'preuzeo'
          "
          color="primary"
          label="Potvrdite primitak artefakta"
          no-caps
          @click="confirmReceipt(selectedContract)"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_kupac_preuzeo === 'preuzeo' &&
            (!selectedContract?.aukcija_ugovor_artefaktodgovara ||
              selectedContract?.aukcija_ugovor_artefaktodgovara === 'nije potvrđeno')
          "
          color="positive"
          label="Odgovara opisu"
          no-caps
          @click="confirmArtifactCondition(selectedContract, 'odgovara opisu')"
        />

        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_kupac_preuzeo === 'preuzeo' &&
            (!selectedContract?.aukcija_ugovor_artefaktodgovara ||
              selectedContract?.aukcija_ugovor_artefaktodgovara === 'nije potvrđeno')
          "
          color="negative"
          label="Ne odgovara opisu"
          no-caps
          @click="confirmArtifactCondition(selectedContract, 'ne odgovara opisu')"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Zatvori" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
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
    name: 'status',
    label: 'Status',
    field: (row) => {
      if (row.artefakt_povucen === 'povucen') return 'Povučen'
      if (row.artefakt_odbijen === 'odbijen') return 'Odbijen'

      if (row.aukcija_status === 'zavrsena' && row.aukcija_ugovor) {
        return 'Transakcija u tijeku'
      }

      if (row.aukcija_status === 'zavrsena') {
        return 'Aukcija završena'
      }

      if (['prvi poziv', 'drugi poziv', 'zadnji poziv'].includes(row.aukcija_status)) {
        return 'Na aukciji'
      }

      if (row.aukcija_status === 'ceka') {
        return 'Aukcija zakazana'
      }

      if (row.artefakt_odobren === 'odobren') return 'Odobren'

      return 'Na čekanju procjene'
    },
    align: 'left',
    sortable: true,
  },
  {
    name: 'ugovor',
    label: 'Ugovor',
    field: 'aukcija_ugovor',
    align: 'center',
  },
  {
    name: 'aukcija',
    label: 'Aukcija',
    field: 'aukcija_sifra',
    align: 'center',
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
    name: 'ugovor',
    label: 'Ugovor',
    field: 'aukcija_ugovor',
    align: 'center',
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

const contractDialog = ref(false)
const selectedContract = ref(null)

function openContractDialog(row) {
  console.log('UGOVOR:', row)
  selectedContract.value = row
  contractDialog.value = true
}

async function acceptContract() {
  if (!selectedContract.value) return

  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${selectedContract.value.aukcija_sifra}/accept-contract`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data
    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod prihvata ugovora:', error)
  }
}

async function confirmPayment(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-payment`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde uplate:', error)
  }
}

async function confirmReceivedPayment(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-received-payment`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    await fetchMyAuctions()
    await fetchNotifications()

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde primitka uplate:', error)
  }
}

async function confirmDelivery(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-delivery`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    await fetchMyAuctions()
    await fetchNotifications()

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde isporuke:', error)
  }
}

async function confirmReceipt(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-receipt`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde primitka artefakta:', error)
  }
}

async function confirmArtifactCondition(row, artefaktOdgovara) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-artifact-condition`,
      { artefaktOdgovara },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde stanja artefakta:', error)
  }
}

onMounted(async () => {
  const token = localStorage.getItem('auctiongo_token')

  const response = await axios.get('http://localhost:3000/my-artifacts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  artifacts.value = response.data
  console.log('Artefakti:', artifacts.value)
  console.log(response.data)

  await fetchNotifications()
  await fetchMyAuctions()
})
socket.on('bid-updated', async () => {
  await fetchMyAuctions()
  await fetchNotifications()
})
socket.on('auction-closed', async () => {
  await fetchMyAuctions()
  await fetchNotifications()
})

onUnmounted(() => {
  socket.off('bid-updated')
  socket.off('auction-closed')
  socket.disconnect()
})
</script>
