<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-lg">Administratorska ploča</div>

    <div class="row q-col-gutter-md q-mb-xl">
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1">Korisnici</div>
            <div class="text-h5">{{ users.length }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1">Artefakti</div>
            <div class="text-h5">
              {{ artifacts.length }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1">Procjene na čekanju</div>
            <div class="text-h5">{{ pendingAppraisalsCount }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="q-mt-xl">
      <div class="section-title q-mt-xl q-mb-md">Svi artefakti</div>
      <div class="q-mb-xl">
        <q-table
          :rows="artifacts"
          :columns="artifactColumns"
          row-key="artefakt_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[5, 10, 20, 50, 0]"
        >
          <template v-slot:body-cell-dodjela_procjenitelja="props">
            <q-td :props="props">
              <q-select
                v-model="props.row.artefakt_procjenitelj_sifra"
                :options="appraisers"
                option-label="korisnik_username"
                option-value="korisnik_sifra"
                emit-value
                map-options
                dense
                outlined
                label="Odaberi"
                @update:model-value="assignAppraiser(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <div class="q-mt-xl">
      <div class="section-title q-mt-xl q-mb-md">Svi korisnici</div>

      <div class="q-mb-xl">
        <q-table
          :rows="users"
          :columns="userColumns"
          row-key="korisnik_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 10 }"
          :rows-per-page-options="[5, 10, 20, 50, 0]"
        />
      </div>
    </div>
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
import { ref, onMounted, computed } from 'vue'
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
    name: 'procjena_status',
    label: 'Procjena',
    field: (row) => (row.artefakt_procjena_sifra === null ? 'Na čekanju' : 'Procijenjeno'),
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
  {
    name: 'dodjela_procjenitelja',
    label: 'Procjenitelj',
    field: 'artefakt_procjenitelj_sifra',
    align: 'left',
  },
]

const users = ref([])
const userColumns = [
  {
    name: 'ime_prezime',
    label: 'Ime i prezime',
    field: (row) => `${row.korisnik_ime} ${row.korisnik_prezime}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'korisnik_username',
    label: 'Korisničko ime',
    field: 'korisnik_username',
    align: 'left',
    sortable: true,
  },
  {
    name: 'korisnik_email',
    label: 'Email',
    field: 'korisnik_email',
    align: 'left',
    sortable: true,
  },
  {
    name: 'korisnik_uloga',
    label: 'Uloga',
    field: 'korisnik_uloga',
    align: 'left',
    sortable: true,
  },
  {
    name: 'korisnik_status',
    label: 'Status',
    field: 'korisnik_status',
    align: 'left',
    sortable: true,
  },
]

const pendingAppraisalsCount = computed(() => {
  return artifacts.value.filter((artifact) => artifact.artefakt_procjena_sifra === null).length
})

async function fetchArtifacts() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/admin/artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data
    console.log('Artefakti za admina:', artifacts.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata:', error)
  }
}

async function fetchUsers() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    users.value = response.data
    console.log('Korisnici za admina:', users.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja korisnika:', error)
  }
}

const appraisers = ref([])
async function fetchAppraisers() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/appraisers', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    appraisers.value = response.data
    console.log('Procjenitelji:', appraisers.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja procjenitelja:', error)
  }
}

async function assignAppraiser(artifact) {
  const token = localStorage.getItem('auctiongo_token')

  try {
    await axios.put(
      `http://localhost:3000/api/admin/artifacts/${artifact.artefakt_sifra}/assign-appraiser`,
      {
        appraiserId: artifact.artefakt_procjenitelj_sifra,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    console.log('Procjenitelj spremljen za artefakt:', artifact.artefakt_sifra)
  } catch (error) {
    console.error('Greška kod spremanja procjenitelja:', error)
  }
}

onMounted(() => {
  fetchArtifacts()
  fetchUsers()
  fetchAppraisers()
})
</script>
