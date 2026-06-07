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
    />
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
    align: 'right',
    sortable: true,
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

onMounted(() => {
  fetchArtifacts()
})
</script>
