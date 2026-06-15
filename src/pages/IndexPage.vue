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
        <div class="text-h2 text-dark">AuctionGO</div>

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

    <div class="row q-col-gutter-xl q-mt-lg" style="width: 100%; max-width: 1200px">
      <!-- Aktivne aukcije -->
      <div class="col-12 col-md-8">
        <div
          class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
          style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
        >
          Aktivne aukcije
        </div>
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-4">
                <div
                  class="flex flex-center rounded-borders"
                  style="height: 120px; background-color: #f9f6ef; border: 1px solid #d4a017"
                >
                  Fotografija
                </div>
              </div>

              <div class="col-12 col-sm-8">
                <div class="text-h6 text-dark">Vintage sat</div>

                <div class="text-body2 text-grey-8 q-mt-xs">Prodavatelj: @antikviteti_ri</div>

                <div class="text-body2 q-mt-sm">Stanje: očuvano</div>

                <div class="text-body2">Početna cijena: 50 €</div>

                <div class="text-h6 text-dark q-mt-sm">Trenutna cijena: 75 €</div>

                <q-btn
                  color="primary"
                  text-color="dark"
                  label="Pogledaj aukciju"
                  no-caps
                  rounded
                  unelevated
                  class="q-mt-sm"
                  to="/auctiondetail"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-4">
                <div
                  class="flex flex-center rounded-borders"
                  style="height: 120px; background-color: #f9f6ef; border: 1px solid #d4a017"
                >
                  Fotografija
                </div>
              </div>

              <div class="col-12 col-sm-8">
                <div class="text-h6 text-dark">Umjetnička slika</div>

                <div class="text-body2 text-grey-8 q-mt-xs">Prodavatelj: @galerija_ri</div>

                <div class="text-body2 q-mt-sm">Stanje: vrlo dobro</div>

                <div class="text-body2">Početna cijena: 200 €</div>

                <div class="text-h6 text-dark q-mt-sm">Trenutna cijena:200 €</div>

                <q-btn
                  color="primary"
                  text-color="dark"
                  label="Pogledaj aukciju"
                  no-caps
                  rounded
                  unelevated
                  class="q-mt-sm"
                  to="/auctiondetail"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-4">
                <div
                  class="flex flex-center rounded-borders"
                  style="height: 120px; background-color: #f9f6ef; border: 1px solid #d4a017"
                >
                  Fotografija
                </div>
              </div>

              <div class="col-12 col-sm-8">
                <div class="text-h6 text-dark">Antikna vaza</div>

                <div class="text-body2 text-grey-8 q-mt-xs">Prodavatelj: @antikvariajt</div>

                <div class="text-body2 q-mt-sm">Stanje: dobro</div>

                <div class="text-body2">Početna cijena: 120 €</div>

                <div class="text-h6 text-dark q-mt-sm">Trenutna cijena: 145 €</div>

                <q-btn
                  color="primary"
                  text-color="dark"
                  label="Pogledaj aukciju"
                  no-caps
                  rounded
                  unelevated
                  class="q-mt-sm"
                  to="/auctiondetail"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Završene aukcije -->
      <div class="col-12 col-md-4">
        <div
          class="text-h5 text-dark q-pa-md rounded-borders q-mb-md"
          style="background-color: #ffffff; border-left: 5px solid #0f172a"
        >
          Završene aukcije
        </div>
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-subtitle1">Džepni sat</div>
            <div>Prodano za 180 €</div>
          </q-card-section>
        </q-card>

        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-subtitle1">Keramička vaza</div>
            <div>Prodano za 95 €</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
  <q-dialog v-model="systemReviewsDialog">
    <q-card style="min-width: 900px; max-width: 95vw">
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

      <q-card-actions align="right">
        <q-btn flat label="Zatvori" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
    field: 'recenzija_sustava_datum',
    align: 'left',
    sortable: true,
  },
]

onMounted(async () => {
  await fetchSystemReviews()
})
</script>
