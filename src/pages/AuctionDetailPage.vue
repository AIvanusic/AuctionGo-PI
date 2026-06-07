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
            style="height: 280px; border: 1px solid #d4a017"
            fit="cover"
          />

          <div
            v-else
            class="flex flex-center rounded-borders q-mb-md"
            style="height: 280px; background-color: #f9f6ef; border: 1px solid #d4a017"
          >
            Glavna fotografija
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="(photo, index) in auction?.fotografije || []" :key="index" class="col-4">
              <q-img
                :src="photo.fotografija_podatak"
                style="height: 90px; border: 1px solid #d4a017; cursor: pointer"
                fit="cover"
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
            Satovi
          </div>

          <div class="text-h3 text-dark text-weight-medium">
            {{ auction?.artefakt_naziv || 'Učitavanje...' }}
          </div>
          <div class="text-body1 text-grey-8 q-mt-sm">
            Prodavatelj: {{ auction?.korisnik_username }}
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
                {{ formatDate(auction?.aukcija_kraj) }}
              </div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-4">
            <q-input outlined label="Vaša ponuda (€)" model-value="80" />
          </div>

          <div class="col-auto">
            <q-btn
              color="primary"
              class="q-mb-sm"
              text-color="dark"
              label="Ponudi"
              no-caps
              rounded
              unelevated
            />
          </div>
        </div>
      </q-card>

      <div
        class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md q-mt-xl"
        style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
      >
        Povijest ponuda
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

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
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('hr-HR')
}

const selectedPhoto = ref('')

async function fetchAuction() {
  try {
    const response = await axios.get(`http://localhost:3000/api/auctions/${route.params.id}`)

    auction.value = response.data
    if (auction.value.fotografije?.length > 0) {
      selectedPhoto.value = auction.value.fotografije[0].fotografija_podatak
    }
    console.log('Detalji aukcije:', auction.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja detalja aukcije:', error)
  }
}

function selectPhoto(photo) {
  selectedPhoto.value = photo.fotografija_podatak
}

onMounted(() => {
  fetchAuction()
})
</script>
