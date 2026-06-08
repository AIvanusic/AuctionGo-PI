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
        />
      </div>
    </div>
    <div v-else class="q-mt-lg">Za pregled profila potrebno se prijaviti.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

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

onMounted(async () => {
  const token = localStorage.getItem('auctiongo_token')

  const response = await axios.get('http://localhost:3000/my-artifacts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  artifacts.value = response.data

  console.log(response.data)
})
</script>
