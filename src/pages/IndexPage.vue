<template>
  <div
    class="column items-center q-px-xl q-pt-md q-pb-xl"
    style="background-color: #f9f6ef; min-height: 100vh"
  >
    <div class="row justify-center items-center q-gutter-xl q-mt-sm">
      <img
        src="../assets/CleanLogoAukcijeGo.png"
        alt="AuctionGO"
        style="max-width: 260px; width: 100%"
      />

      <div>
        <div class="text-h2 text-dark">AuctionGo!</div>

        <div class="text-subtitle1 text-dark">Digitalne aukcije u stvarnom vremenu</div>
      </div>
      <div class="q-pa-lg text-center">
        <div class="text-h5 q-mb-sm">Korisnici su nas ocijenili</div>

        <q-rating
          :model-value="Number(systemReviewsSummary.prosjecna_ocjena || 0)"
          readonly
          size="24px"
          color="amber"
        />

        <div class="q-mt-sm">
          {{ systemReviewsSummary.prosjecna_ocjena || 0 }}/5 ({{
            systemReviewsSummary.broj_recenzija || 0
          }}
          recenzija)
        </div>

        <q-btn
          flat
          color="primary"
          label="Pogledajte komentare"
          @click="systemReviewsDialog = true"
        />
      </div>
    </div>

    <div class="q-mt-md" style="width: 100%; max-width: 1200px">
      <div
        class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
        style="background-color: #ffffff; border-left: 5px solid #d4a017"
      >
        Kako funkcionira AuctionGo!?
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-md full-height text-center">
            <q-icon name="inventory_2" size="42px" color="primary" />
            <div class="text-h6 text-dark q-mt-sm">Prijava artefakta</div>
            <div class="text-body2 text-grey-8 q-mt-sm">
              Korisnik unosi podatke, opis i fotografije artefakta.
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-md full-height text-center">
            <q-icon name="manage_search" size="42px" color="primary" />
            <div class="text-h6 text-dark q-mt-sm">Procjena vrijednosti</div>
            <div class="text-body2 text-grey-8 q-mt-sm">
              Procjenitelj pregledava artefakt i unosi stručnu procjenu.
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-md full-height text-center">
            <q-icon name="gavel" size="42px" color="primary" />
            <div class="text-h6 text-dark q-mt-sm">Aukcija uživo</div>
            <div class="text-body2 text-grey-8 q-mt-sm">
              Kupci licitiraju ručno ili koriste automatsko licitiranje.
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-md full-height text-center">
            <q-icon name="description" size="42px" color="primary" />
            <div class="text-h6 text-dark q-mt-sm">Kupoprodajni ugovor</div>
            <div class="text-body2 text-grey-8 q-mt-sm">
              Nakon završetka aukcije sustav podržava kupoprodajni postupak.
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-xl q-mt-lg" style="width: 100%; max-width: 1200px">
      <!-- Aktivne aukcije -->
      <div class="col-12 col-md-8">
        <div
          class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
          style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
        >
          Trenutno u ponudi:
        </div>

        <q-card v-for="auction in activeAuctions" :key="auction.aukcija_sifra" class="q-mb-md">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-3">
                <q-img
                  v-if="auction.fotografija_podatak"
                  :src="auction.fotografija_podatak"
                  style="height: 110px; border-radius: 20px"
                  fit="contain"
                />

                <div
                  v-else
                  class="flex flex-center text-grey-7"
                  style="
                    height: 90px;
                    background-color: #f9f6ef;
                    border: 1px solid #d4a017;
                    border-radius: 10px;
                  "
                >
                  Fotografija
                </div>
              </div>

              <div class="col-12 col-sm-9">
                <div class="text-h6 text-dark">
                  {{ auction.aukcija_naziv }}
                </div>

                <div class="text-body2">
                  Trenutna cijena:
                  {{ formatPrice(auction.aukcija_cijena_trenutna) }}
                </div>

                <div class="text-body2">
                  Završava:
                  {{ formatDate(auction.aukcija_kraj) }}
                </div>

                <q-btn
                  color="secondary"
                  text-color="white"
                  label="Pregled aukcije"
                  no-caps
                  rounded
                  unelevated
                  class="q-mt-sm"
                  @click="openAuction(auction)"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card v-if="activeAuctions.length === 0" flat bordered>
          <q-card-section class="text-grey-8"> Trenutno nema aktivnih aukcija. </q-card-section>
        </q-card>
      </div>

      <!-- Završene i najavljene aukcije -->
      <div class="col-12 col-md-4 cursor-pointer" @click="router.push('/auctions')">
        <div
          class="text-h5 text-dark q-pa-md rounded-borders q-mb-md"
          :style="
            showUpcomingBlock
              ? 'background-color: #fdf8e8; border-left: 5px solid #d4a017'
              : 'background-color: #f4f6f9; border-left: 5px solid #0f172a'
          "
        >
          {{ showUpcomingBlock ? 'Najavljene aukcije' : 'Završene aukcije' }}
        </div>
        <q-card
          v-for="auction in showUpcomingBlock ? upcomingAuctions : finishedAuctions"
          :key="auction.aukcija_sifra"
          class="q-mb-md"
        >
          <q-card-section>
            <div class="row q-col-gutter-sm items-center">
              <div class="col-4">
                <q-img
                  v-if="auction.fotografija_podatak"
                  :src="auction.fotografija_podatak"
                  style="height: 70px; border-radius: 8px"
                  fit="contain"
                />

                <div
                  v-else
                  class="flex flex-center text-grey-7"
                  style="
                    height: 100px;
                    background-color: #f9f6ef;
                    border: 3px solid #d4a017;
                    border-radius: 8px;
                  "
                >
                  Foto
                </div>
              </div>

              <div class="col-8">
                <div class="text-subtitle1 text-weight-medium">
                  {{ auction.aukcija_naziv }}
                </div>

                <div class="text-body2">
                  {{ showUpcomingBlock ? 'Početna cijena:' : 'Prodano za:' }}
                  {{
                    formatPrice(
                      showUpcomingBlock
                        ? auction.aukcija_cijena_pocetna
                        : auction.aukcija_cijena_trenutna,
                    )
                  }}
                </div>

                <div class="text-caption text-grey-7">
                  {{ showUpcomingBlock ? 'Počinje:' : 'Završeno:' }}
                  {{
                    formatDate(showUpcomingBlock ? auction.aukcija_pocetak : auction.aukcija_kraj)
                  }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card
          v-if="showUpcomingBlock ? upcomingAuctions.length === 0 : finishedAuctions.length === 0"
          flat
          bordered
        >
          <q-card-section class="text-grey-8"> Nema završenih aukcija. </q-card-section>
        </q-card>
      </div>
    </div>
  </div>

  <q-dialog v-model="systemReviewsDialog">
    <q-card style="width: 95vw; max-width: 900px">
      <q-card-section>
        <div class="text-h6">Recenzije sustava AuctionGO</div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="systemReviews"
          :columns="systemReviewColumns"
          row-key="recenzija_sustava_sifra"
          flat
          bordered
        />
      </q-card-section>

      <q-card-actions align="right" class="bg-white">
        <q-btn flat label="Zatvori" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const systemReviews = ref([])
const systemReviewsSummary = ref({})
const systemReviewsDialog = ref(false)

async function fetchSystemReviews() {
  try {
    const response = await axios.get('http://localhost:3000/api/system-reviews')

    systemReviews.value = response.data.reviews
    systemReviewsSummary.value = response.data.summary
  } catch (error) {
    console.error('Greška kod dohvaćanja recenzija sustava:', error)
  }
}

const systemReviewColumns = [
  {
    name: 'ocjena',
    label: 'Ocjena',
    field: 'recenzija_sustava_ocjena',
    align: 'center',
    sortable: true,
  },
  {
    name: 'komentar',
    label: 'Komentar',
    field: 'recenzija_sustava_komentar',
    align: 'left',
  },
  {
    name: 'korisnik',
    label: 'Korisnik',
    field: 'korisnik_username',
    align: 'left',
  },
  {
    name: 'datum',
    label: 'Datum',
    field: (row) =>
      new Date(row.recenzija_sustava_datum).toLocaleString('hr-HR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    align: 'left',
    sortable: true,
  },
]

const auctions = ref([])

async function fetchAuctions() {
  try {
    const response = await axios.get('http://localhost:3000/api/auctions')

    auctions.value = response.data

    console.log('Aktivne:', activeAuctions.value)
    console.log('Najavljene:', upcomingAuctions.value)
    console.log('Završene:', finishedAuctions.value)

    console.log('Aukcije:', auctions.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja aukcija:', error)
  }
}

const upcomingAuctions = computed(() =>
  auctions.value.filter((auction) => new Date(auction.aukcija_pocetak) > new Date()).slice(0, 3),
)

const activeAuctions = computed(() =>
  auctions.value
    .filter(
      (auction) =>
        new Date(auction.aukcija_pocetak) <= new Date() &&
        new Date(auction.aukcija_kraj) > new Date() &&
        auction.aukcija_status !== 'zavrsena',
    )
    .slice(0, 3),
)

const finishedAuctions = computed(() =>
  auctions.value
    .filter(
      (auction) =>
        auction.aukcija_status === 'zavrsena' ||
        auction.aukcija_statusend === 'uspjesno zavrsena' ||
        auction.aukcija_statusend === 'bez ponuda',
    )
    .slice(0, 3),
)

const router = useRouter()
function formatPrice(value) {
  return (
    Number(value).toLocaleString('hr-HR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('hr-HR')
}

function openAuction(auction) {
  router.push(`/auctiondetail/${auction.aukcija_sifra}`)
}

const showUpcomingBlock = ref(true)
let auctionPanelInterval = null

onMounted(async () => {
  await fetchSystemReviews()
  await fetchAuctions()

  auctionPanelInterval = setInterval(() => {
    showUpcomingBlock.value = !showUpcomingBlock.value
  }, 15000)
})

onUnmounted(() => {
  if (auctionPanelInterval) {
    clearInterval(auctionPanelInterval)
  }
})
</script>
