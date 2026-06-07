<template>
  <q-page class="q-pa-lg" style="background-color: #f9f6ef">
    <div
      class="text-h5 text-dark q-pa-lg rounded-borders q-mb-lg"
      style="background-color: white; border-left: 5px solid #1e6b4c"
    >
      Aktivne aukcije
    </div>

    <div class="row q-col-gutter-lg">
      <div
        v-for="auction in auctions"
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const auctions = ref([])

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

    console.log('Aukcije:', auctions.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja aukcija:', error)
  }
}

onMounted(() => {
  fetchAuctions()
})
</script>
