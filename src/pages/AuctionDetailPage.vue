<template>
  <div
    class="column items-center q-px-xl q-pt-md q-pb-xl"
    style="background-color: #f9f6ef; min-height: 100vh"
  >
    <div class="row q-col-gutter-xl q-mt-sm" style="width: 100%; max-width: 1200px">
      <div class="col-12">
        <div
          class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
          style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
        >
          Detalji aukcije
        </div>
      </div>

      <div class="col-12 col-md-7">
        <q-card class="q-pa-md">
          <q-img
            v-if="selectedPhoto"
            :src="selectedPhoto"
            class="rounded-borders q-mb-md"
            style="height: 480px; border: 1px solid #d4a017"
            fit="contain"
          />

          <div
            v-else
            class="flex flex-center rounded-borders q-mb-md"
            style="height: 480px; background-color: #f9f6ef; border: 1px solid #d4a017"
          >
            Glavna fotografija
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="(photo, index) in auction?.fotografije || []" :key="index" class="col-4">
              <q-img
                :src="photo.fotografija_podatak"
                style="height: 90px; border: 1px solid #d4a017; cursor: pointer"
                fit="contain"
                class="rounded-borders"
                @click="selectPhoto(photo)"
              />
            </div>

            <div
              v-for="n in Math.max(0, 3 - (auction?.fotografije?.length || 0))"
              :key="`placeholder-${n}`"
              class="col-4"
            >
              <div
                class="flex flex-center rounded-borders"
                style="height: 90px; background-color: #f9f6ef; border: 1px solid #d4a017"
              >
                AuctionGO!
              </div>
            </div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-md-5">
        <q-card class="q-pa-lg">
          <div
            class="inline-block q-px-md q-py-xs rounded-borders text-white q-mb-md"
            style="background-color: #1e6b4c"
          >
            Kategorija: {{ auction?.kategorija_naziv || 'Kategorija' }}
          </div>

          <div class="text-h3 text-dark text-weight-medium">
            {{ auction?.artefakt_naziv || 'Učitavanje...' }}
          </div>
          <div v-if="auction" class="text-body2 text-grey-8 q-mt-sm">
            <strong>Prodavatelj:</strong>
            {{ auction.korisnik_username }}

            <span
              v-if="Number(auction.prodavatelj_broj_recenzija) > 0"
              class="q-ml-sm text-primary text-weight-medium cursor-pointer"
              style="text-decoration: underline"
              @click="openSellerReviews"
            >
              <q-rating
                :model-value="Number(auction.prodavatelj_prosjecna_ocjena)"
                readonly
                size="18px"
                color="amber"
              />

              <span class="q-ml-xs">
                {{ auction.prodavatelj_prosjecna_ocjena }}
                (Ocijenilo korisnika: {{ auction.prodavatelj_broj_recenzija }})
              </span>
            </span>

            <span v-else class="q-ml-sm text-grey-7"> Još nema recenzija </span>
          </div>

          <q-separator class="q-my-lg" />

          <div class="text-body1 q-mb-sm">
            <strong>Marka:</strong> {{ auction?.artefakt_marka || '-' }}
          </div>

          <div class="text-body1 q-mb-sm">
            <strong>Model:</strong> {{ auction?.artefakt_model || '-' }}
          </div>

          <div class="text-body1 q-mb-sm">
            <strong>Godina proizvodnje:</strong> {{ auction?.artefakt_datum_proizvodnje || '-' }}
          </div>

          <div class="text-body1">
            <strong>Stanje:</strong> {{ auction?.artefakt_stanje || '-' }}
          </div>
        </q-card>
        <q-card class="q-pa-lg q-mt-xl">
          <div class="text-h6 q-mb-md">Opis artefakta</div>

          <div class="text-body1">
            {{ auction?.artefakt_opis || 'Opis nije dostupan.' }}
          </div>
        </q-card>
      </div>
    </div>

    <div class="q-mt-xl" style="width: 100%; max-width: 1200px">
      <div
        class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
        style="background-color: #ffffff; border-left: 5px solid #d4a017"
      >
        Aukcija
      </div>

      <q-card class="q-pa-lg">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-8">Početna cijena</div>
              <div class="text-h6 text-dark">
                {{ formatPrice(auction?.aukcija_cijena_pocetna) }}
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-8">Trenutna cijena</div>
              <div class="text-h4 text-dark text-weight-bold">
                {{ formatPrice(auction?.aukcija_cijena_trenutna) }}
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-8">Završava za</div>
              <div class="text-h6 text-dark">
                {{ timeLeft }}
              </div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-4">
            <q-input
              v-model="bidAmount"
              outlined
              label="Vaša ponuda (€)"
              type="text"
              :disable="isAuctionEnded"
            />
          </div>

          <div v-if="isAuctionEnded" class="text-grey-8 q-mb-md">Aukcija je završena.</div>

          <div class="col-auto">
            <div v-if="isLeadingBidder" class="text-positive q-mb-md">
              Trenutno imate vodeću ponudu.
            </div>
            <div v-else-if="bids.length > 0" class="text-negative q-mb-md">
              Niste vodeći ponuditelj.
            </div>
            <q-btn
              color="primary"
              class="q-mb-sm"
              text-color="dark"
              label="Ponudite"
              no-caps
              rounded
              unelevated
              @click="placeBid"
              :disable="isAuctionEnded"
            />
            <div class="q-mt-sm">
              <q-btn
                v-if="myAutobid"
                color="primary"
                text-color="dark"
                label="Promijeni autobid"
                no-caps
                rounded
                unelevated
                @click="autobidDialog = true"
              />

              <q-btn
                v-else
                color="primary"
                text-color="dark"
                label="Postavi autobid"
                no-caps
                rounded
                unelevated
                @click="autobidDialog = true"
              />

              <div v-if="myAutobid" class="text-secondary text-weight-medium q-mt-sm">
                ✓ Autobid aktivan do
                {{ formatPrice(myAutobid.autobid_maksimalni_iznos) }}
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <div
        class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md q-mt-xl"
        style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
      >
        Povijest ponuda
      </div>
      <q-card class="q-pa-md">
        <q-table
          :rows="bids"
          :columns="bidColumns"
          row-key="ponuda_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 10 }"
        />
      </q-card>
    </div>
    let countdownInterval
  </div>
  <q-dialog v-model="reviewsDialog">
    <q-card style="min-width: 600px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Recenzije prodavatelja</div>
      </q-card-section>

      <q-card-section>
        <div v-if="sellerReviews.length === 0" class="text-grey-7">
          Prodavatelj još nema recenzija.
        </div>

        <div v-for="review in sellerReviews" :key="review.recenzija_sifra" class="q-mb-md">
          <div class="text-weight-medium">
            {{ review.aukcija_naziv || 'Aukcija' }}
          </div>

          <div>⭐ {{ review.recenzija_ocjena }}/5</div>

          <div v-if="review.recenzija_komentar" class="text-body2 q-mt-xs">
            {{ review.recenzija_komentar }}
          </div>

          <div class="text-caption text-grey-7 q-mt-xs">
            Kupac: {{ review.davatelj_username || 'Korisnik' }}
          </div>

          <q-separator class="q-mt-md" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Zatvori" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="autobidDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Postavi autobid</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="autobidMaxAmount"
          type="number"
          label="Maksimalni iznos"
          suffix="€"
          outlined
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Odustani" color="dark" v-close-popup />
        <q-btn label="Spremi" color="primary" @click="saveAutobid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { Notify } from 'quasar'
import { socket } from 'src/services/socket'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const route = useRoute()

const auction = ref(null)

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

function formatDate(value) {
  const date = new Date(value)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year}. ${hour}:${minute}`
}

const selectedPhoto = ref('')

async function fetchAuction() {
  try {
    const response = await axios.get(`http://localhost:3000/api/auctions/${route.params.id}`)

    auction.value = response.data
    console.log('AUKCIJA:', response.data)

    updateCountdown()
    if (auction.value.fotografije?.length > 0) {
      selectedPhoto.value = auction.value.fotografije[0].fotografija_podatak
    }
  } catch (error) {
    console.error('Greška kod dohvaćanja detalja aukcije:', error)
  }
}

function selectPhoto(photo) {
  selectedPhoto.value = photo.fotografija_podatak
}

const bidAmount = ref('')

async function placeBid() {
  const bidValue = Number(String(bidAmount.value).replace(',', '.'))

  if (!bidAmount.value || Number.isNaN(bidValue)) {
    Notify.create({
      type: 'negative',
      message: 'Unesite ispravan iznos ponude.',
      position: 'center',
    })
    return
  }

  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.post(
      `http://localhost:3000/api/auctions/${route.params.id}/bids`,
      {
        ponuda_cijena_ponudjena: bidValue,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    Notify.create({
      type: 'positive',
      message: response.data.message,
      position: 'center',
    })

    await fetchAuction()
    await fetchBids()

    bidAmount.value = ''
  } catch (error) {
    console.error('Greška kod ponude:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Ponuda nije spremljena.',
      position: 'center',
    })
  }
}

const bids = ref([])

async function fetchBids() {
  try {
    const response = await axios.get(`http://localhost:3000/api/auctions/${route.params.id}/bids`)

    bids.value = response.data
  } catch (error) {
    console.error('Greška kod dohvaćanja ponuda:', error)
  }
}

const bidColumns = [
  {
    name: 'vrijeme',
    label: 'Vrijeme',
    field: 'ponuda_vrijeme',
    align: 'left',
    sortable: true,
    format: (val) => formatDate(val),
  },
  {
    name: 'iznos',
    label: 'Ponuda (€)',
    field: 'ponuda_cijena_ponudjena',
    align: 'right',
    sortable: true,
    format: (val) =>
      Number(val).toLocaleString('hr-HR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
]

const currentUser = JSON.parse(localStorage.getItem('auctiongo_user'))

const isLeadingBidder = computed(() => {
  if (!currentUser || bids.value.length === 0) {
    return false
  }

  return bids.value[0].ponuda_korisnik_sifra === currentUser.korisnik_sifra
})

const timeLeft = ref('')
let countdownInterval
const auctionEnded = ref(false)

function updateCountdown() {
  if (!auction.value?.aukcija_kraj) {
    timeLeft.value = '-'
    return
  }

  const endDate = new Date(auction.value.aukcija_kraj)
  const now = new Date()

  const diff = endDate - now

  if (diff <= 0) {
    timeLeft.value = 'Aukcija je završena'
    auctionEnded.value = true
    return
  }

  auctionEnded.value = false

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  timeLeft.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

const isAuctionEnded = computed(() => auctionEnded.value)

const reviewsDialog = ref(false)
const sellerReviews = ref([])

async function openSellerReviews() {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/users/${auction.value.prodavatelj_sifra}/reviews`,
    )

    sellerReviews.value = response.data
    reviewsDialog.value = true
  } catch (error) {
    console.error('Greška kod dohvaćanja recenzija prodavatelja:', error)
  }
}

const autobidDialog = ref(false)
const autobidMaxAmount = ref(null)

async function saveAutobid() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.post(
      `http://localhost:3000/api/auctions/${auction.value.aukcija_sifra}/autobid`,
      {
        maksimalniIznos: autobidMaxAmount.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    $q.notify({
      color: 'positive',
      message: response.data.message,
      icon: 'check',
    })

    autobidDialog.value = false
    autobidMaxAmount.value = null

    await fetchMyAutobid()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Greška kod spremanja autobida.',
      icon: 'warning',
    })
  }
}

const myAutobid = ref(null)

async function fetchMyAutobid() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.get(
      `http://localhost:3000/api/auctions/${route.params.id}/autobid/my`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    console.log('AUTOBID:', response.data)

    myAutobid.value = response.data
  } catch (error) {
    console.error('Greška kod dohvaćanja autobida:', error)
  }
}

onMounted(() => {
  fetchAuction()
  fetchBids()
  fetchMyAutobid()

  countdownInterval = setInterval(() => {
    updateCountdown()
  }, 1000)
  socket.on('connect', () => {
    console.log('Socket spojen na frontend:', socket.id)
  })
  socket.on('bid-updated', async (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      await fetchAuction()
      await fetchBids()
    }
  })
  socket.on('bid-updated', async (data) => {
    if (String(data.auctionId) === String(route.params.id)) {
      await fetchAuction()
      await fetchBids()
    }
  })
})

onUnmounted(() => {
  clearInterval(countdownInterval)
  socket.off('auction-closed')
})
</script>
