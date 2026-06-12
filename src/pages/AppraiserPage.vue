<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-lg">Procjeniteljska ploča</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1">Moji artefakti za procjenu</div>
        <div class="text-h5">
          {{ artifacts.length }}
        </div>
      </q-card-section>
    </q-card>

    <div class="section-title q-mt-xl q-mb-md">Dodijeljeni artefakti</div>

    <q-table
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
            text-color="dark"
            label="Procijenite"
            no-caps
            dense
            @click="openAppraisalDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <div class="section-title q-mt-xl q-mb-md">Povijest procjena</div>

    <q-table
      :rows="appraisalHistory"
      :columns="historyColumns"
      row-key="artefakt_sifra"
      flat
      bordered
      :pagination="{ rowsPerPage: 10 }"
      :rows-per-page-options="[5, 10, 20, 50, 0]"
    />

    <q-dialog v-model="appraisalDialog">
      <q-card style="width: 900px; max-width: 95vw; max-height: 90vh" class="scroll">
        <q-card-section v-if="selectedArtifact">
          <div class="text-h6 q-mb-sm">Artefakt: {{ selectedArtifact.artefakt_naziv }}</div>

          <div class="text-body2 text-grey-8 q-mb-xs">
            <strong>Kategorija:</strong> {{ selectedArtifact.kategorija_naziv || '-' }}
          </div>

          <div class="text-body2 text-grey-8 q-mb-xs">
            <strong>Marka:</strong> {{ selectedArtifact.artefakt_marka || '-' }}
          </div>

          <div class="text-body2 text-grey-8 q-mb-xs">
            <strong>Model:</strong> {{ selectedArtifact.artefakt_model || '-' }}
          </div>

          <div class="text-body2 text-grey-8 q-mb-xs">
            <strong>Godina proizvodnje:</strong>
            {{ selectedArtifact.artefakt_datum_proizvodnje || '-' }}
          </div>

          <div class="text-body2 text-grey-8 q-mb-xs">
            <strong>Stanje:</strong> {{ selectedArtifact.artefakt_stanje || '-' }}
          </div>

          <div class="text-body2 text-grey-8 q-mb-xs">
            <strong>Tražena cijena:</strong>
            {{ formatPrice(selectedArtifact.artefakt_cijena_trazena) }}
          </div>

          <div class="text-body2 text-grey-8 q-mt-sm">
            <strong>Opis:</strong>
            {{ selectedArtifact.artefakt_opis || 'Opis nije dostupan.' }}
          </div>
        </q-card-section>

        <q-separator /><q-card-section>
          <div class="text-h6">Procjena artefakta {{ selectedArtifact?.artefakt_naziv }}</div>

          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Fotografije artefakta</div>

            <div v-if="artifactPhotos.length > 0" class="row q-col-gutter-sm">
              <div v-for="(photo, index) in artifactPhotos" :key="index" class="col-12 col-sm-4">
                <q-img
                  :src="photo.fotografija_podatak"
                  fit="contain"
                  class="rounded-borders"
                  style="height: 160px; background-color: #f9f6ef; border: 1px solid #d4a017"
                />
              </div>
            </div>

            <div v-else class="text-grey-7">Fotografije nisu dostupne.</div>
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="appraisalForm.procjena_opis"
            type="textarea"
            label="Opis procjene"
            outlined
          />

          <q-input
            v-model="appraisalForm.procjena_cijena_procijenjena"
            type="number"
            label="Procijenjena vrijednost (€)"
            outlined
            class="q-mt-md"
          />

          <q-input
            v-model="appraisalForm.procjena_fotografija"
            label="Dodatne fotografije (link ili naziv)"
            outlined
            class="q-mt-md"
          />

          <q-input
            v-model="appraisalForm.procjena_dodatni_dokazi"
            label="Dodatni dokazi / dokumenti"
            outlined
            type="textarea"
            class="q-mt-md"
          />

          <q-select
            v-model="appraisalForm.procjena_preporuka"
            :options="recommendationOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Preporuka procjenitelja"
            outlined
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Odustani" v-close-popup />

          <q-btn
            color="primary"
            text-color="dark"
            label="Spremite procjenu"
            @click="saveAppraisal"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.section-title {
  background-color: #0f172a;
  color: white;
  padding: 12px 16px;
  border-left: 5px solid #d4a017;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const artifacts = ref([])

const artifactColumns = [
  {
    name: 'artefakt_naziv',
    label: 'Naziv',
    field: 'artefakt_naziv',
    align: 'left',
    sortable: true,
  },
  {
    name: 'vlasnik',
    label: 'Vlasnik',
    field: (row) => `${row.korisnik_ime} ${row.korisnik_prezime}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'artefakt_stanje',
    label: 'Stanje',
    field: 'artefakt_stanje',
    align: 'left',
    sortable: true,
  },
  {
    name: 'artefakt_cijena_trazena',
    label: 'Tražena cijena',
    field: 'artefakt_cijena_trazena',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'akcije',
    label: 'Akcije',
    field: 'akcije',
    align: 'center',
  },
]

async function fetchArtifacts() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/appraiser/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data
    console.log('Artefakti procjenitelja:', artifacts.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata:', error)
  }
}

async function openAppraisalDialog(artifact) {
  selectedArtifact.value = artifact
  artifactPhotos.value = []

  appraisalForm.value = {
    procjena_opis: '',
    procjena_fotografija: '',
    procjena_dodatni_dokazi: '',
    procjena_cijena_procijenjena: null,
    procjena_preporuka: null,
  }

  await fetchArtifactPhotos(artifact.artefakt_sifra)

  appraisalDialog.value = true
}

const appraisalDialog = ref(false)
const selectedArtifact = ref(null)

const artifactPhotos = ref([])

async function fetchArtifactPhotos(artifactId) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.get(`http://localhost:3000/api/artifacts/${artifactId}/photos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifactPhotos.value = response.data
  } catch (error) {
    console.error('Greška kod dohvaćanja fotografija artefakta:', error)
    artifactPhotos.value = []
  }
}

const appraisalForm = ref({
  procjena_opis: '',
  procjena_fotografija: '',
  procjena_dodatni_dokazi: '',
  procjena_cijena_procijenjena: null,
  procjena_preporuka: null,
})

const recommendationOptions = [
  {
    label: 'Preporučujem odobriti prodaju',
    value: 'odobriti',
  },
  {
    label: 'Preporučujem odbiti prodaju',
    value: 'odbiti',
  },
]

async function saveAppraisal() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    await axios.post(
      `http://localhost:3000/api/appraiser/artifacts/${selectedArtifact.value.artefakt_sifra}/appraisal`,
      appraisalForm.value,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    appraisalDialog.value = false

    await fetchArtifacts()
    await fetchAppraisalHistory()

    console.log('Procjena spremljena.')
  } catch (error) {
    console.error('Greška kod spremanja procjene:', error)
  }
}

const appraisalHistory = ref([])
const historyColumns = [
  {
    name: 'artefakt_naziv',
    label: 'Naziv artefakta',
    field: 'artefakt_naziv',
    align: 'left',
    sortable: true,
  },
  {
    name: 'artefakt_stanje',
    label: 'Stanje',
    field: 'artefakt_stanje',
    align: 'left',
    sortable: true,
  },
  {
    name: 'procjena_cijena_procijenjena',
    label: 'Procijenjena vrijednost',
    field: 'procjena_cijena_procijenjena',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'procjena_preporuka',
    label: 'Preporuka',
    field: 'procjena_preporuka',
    align: 'left',
    sortable: true,
  },
  {
    name: 'procjena_datum',
    label: 'Datum procjene',
    field: 'procjena_datum',
    align: 'left',
    sortable: true,
  },
]

async function fetchAppraisalHistory() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/appraiser/appraisal-history', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    appraisalHistory.value = response.data
    console.log('Povijest procjena:', appraisalHistory.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja povijesti procjena:', error)
  }
}

onMounted(() => {
  fetchArtifacts()
  fetchAppraisalHistory()
})

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
</script>
