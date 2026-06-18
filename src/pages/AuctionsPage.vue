<template>
  <q-page class="q-pa-lg" style="background-color: #f9f6ef">
    <div
      class="text-h5 text-dark q-pa-lg rounded-borders q-mb-lg"
      style="background-color: white; border-left: 5px solid #1e6b4c"
    >
      {{ pageTitle }}
      <q-tabs
        v-model="activeTab"
        dense
        align="left"
        class="text-dark q-mb-lg"
        active-color="secondary"
        indicator-color="primary"
      >
        <q-tab name="upcoming" label="Najavljene" no-caps />
        <q-tab name="active" label="Aktivne" no-caps />
        <q-tab name="finished" label="Završene" no-caps />
      </q-tabs>

      <div class="row q-mb-lg">
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedCategory"
            :options="categoryOptions"
            label="Filtriraj po kategoriji"
            outlined
            emit-value
            map-options
            clearable
          />
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div
        v-for="auction in filteredAuctions"
        :key="auction.aukcija_sifra"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card class="full-height">
          <q-img
            v-if="auction.fotografija_podatak"
            :src="auction.fotografija_podatak"
            style="height: 220px"
            fit="cover"
          />

          <div
            v-else
            class="flex flex-center"
            style="height: 220px; background-color: #f9f6ef; border-bottom: 1px solid #d4a017"
          >
            Fotografija
          </div>

          <q-card-section>
            <div class="text-h6">
              {{ auction.aukcija_naziv }}
            </div>

            <div class="text-grey-8 q-mt-sm">
              <strong>Stanje:</strong> {{ auction.artefakt_stanje }}
            </div>

            <div class="q-mt-md">
              <strong>Trenutna cijena:</strong>
              {{ formatPrice(auction.aukcija_cijena_trenutna) }}
            </div>

            <div class="q-mt-sm">
              <strong>Završava:</strong>
              {{ formatDate(auction.aukcija_kraj) }}
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn color="primary" label="Detalji" no-caps @click="openAuction(auction)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const auctions = ref([])
const activeTab = ref('active')
const selectedCategory = ref(null)

const auctionsByTab = computed(() => {
  const now = new Date()

  if (activeTab.value === 'upcoming') {
    return auctions.value.filter((auction) => new Date(auction.aukcija_pocetak) > now)
  }

  if (activeTab.value === 'finished') {
    return auctions.value.filter(
      (auction) =>
        auction.aukcija_status === 'zavrsena' ||
        auction.aukcija_statusend === 'uspjesno zavrsena' ||
        auction.aukcija_statusend === 'bez ponuda',
    )
  }

  return auctions.value.filter(
    (auction) =>
      new Date(auction.aukcija_pocetak) <= now &&
      new Date(auction.aukcija_kraj) > now &&
      auction.aukcija_status !== 'zavrsena',
  )
})

const filteredAuctions = computed(() => {
  if (!selectedCategory.value) {
    return auctionsByTab.value
  }

  return auctionsByTab.value.filter(
    (auction) => Number(auction.kategorija_sifra) === Number(selectedCategory.value),
  )
})

const categoryOptions = computed(() => {
  const categories = auctionsByTab.value
    .filter((auction) => auction.kategorija_sifra)
    .map((auction) => ({
      label: auction.kategorija_naziv,
      value: auction.kategorija_sifra,
    }))

  return [
    { label: 'Sve kategorije', value: null },
    ...categories.filter(
      (category, index, self) => index === self.findIndex((item) => item.value === category.value),
    ),
  ]
})

function formatPrice(value) {
  return (
    Number(value).toLocaleString('hr-HR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

function formatDate(value) {
  return new Date(value).toLocaleString('hr-HR')
}

function openAuction(auction) {
  router.push(`/auctiondetail/${auction.aukcija_sifra}`)
}

async function fetchAuctions() {
  try {
    const response = await axios.get('http://localhost:3000/api/auctions')
    auctions.value = response.data
  } catch (error) {
    console.error('Greška kod dohvaćanja aukcija:', error)
  }
}

const pageTitle = computed(() => {
  if (activeTab.value === 'upcoming') return 'Najavljene aukcije'
  if (activeTab.value === 'finished') return 'Završene aukcije'
  return 'Aktivne aukcije'
})

onMounted(() => {
  fetchAuctions()
})
</script>
