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
            <div class="text-subtitle1">Artefakti na čekanju procjene</div>
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

    <div class="section-title q-mt-xl q-mb-md">Procijenjeni artefakti</div>

    <q-table
      :rows="appraisals"
      :columns="appraisalColumns"
      row-key="procjena_sifra"
      flat
      bordered
      :pagination="{ rowsPerPage: 10 }"
      :rows-per-page-options="[5, 10, 20, 50, 0]"
    >
      <template v-slot:body-cell-akcije="props">
        <q-td :props="props">
          <q-btn
            color="positive"
            label="Odobrite"
            no-caps
            dense
            class="q-mr-sm"
            @click="approveArtifact(props.row)"
          />

          <q-btn
            color="negative"
            label="Odbijte"
            no-caps
            dense
            @click="rejectArtifact(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <div class="section-title q-mt-xl q-mb-md">Odobreni artefakti</div>

    <q-table
      :rows="approvedArtifacts"
      :columns="approvedArtifactColumns"
      row-key="artefakt_sifra"
      flat
      bordered
      :pagination="{ rowsPerPage: 10 }"
      :rows-per-page-options="[5, 10, 20, 50, 0]"
    >
      <template v-slot:body-cell-voditelj="props">
        <q-td :props="props">
          <q-select
            v-model="props.row.selectedManager"
            :options="managers"
            option-label="korisnik_username"
            option-value="korisnik_sifra"
            emit-value
            map-options
            dense
            outlined
          />
        </q-td>
      </template>

      <template v-slot:body-cell-akcije="props">
        <q-td :props="props">
          <q-btn
            color="primary"
            label="Dodijelite"
            no-caps
            dense
            @click="assignManager(props.row)"
          />
        </q-td>
      </template>
    </q-table>
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
import { Notify } from 'quasar'

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
    name: 'voditelj_username',
    label: 'Voditelj',
    field: (row) => row.voditelj_username || '-',
    align: 'left',
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

const appraisals = ref([])
const appraisalColumns = [
  {
    name: 'artefakt_naziv',
    label: 'Naziv artefakta',
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
  {
    name: 'akcije',
    label: 'Akcije',
    field: 'akcije',
    align: 'center',
  },
]

async function fetchAppraisals() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/admin/appraisals', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    appraisals.value = response.data
    console.log('Procjene za admina:', appraisals.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja procjena:', error)
  }
}

async function approveArtifact(row) {
  const token = localStorage.getItem('auctiongo_token')

  try {
    await axios.put(
      `http://localhost:3000/api/admin/artifacts/${row.artefakt_sifra}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchArtifacts()
    await fetchAppraisals()

    console.log('Artefakt odobren:', row.artefakt_sifra)
  } catch (error) {
    console.error('Greška kod odobravanja:', error)
  }
}

async function rejectArtifact(row) {
  const token = localStorage.getItem('auctiongo_token')

  try {
    await axios.put(
      `http://localhost:3000/api/admin/artifacts/${row.artefakt_sifra}/reject`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchArtifacts()
    await fetchAppraisals()

    console.log('Artefakt odbijen:', row.artefakt_sifra)
  } catch (error) {
    console.error('Greška kod odbijanja:', error)
  }
}

const approvedArtifacts = ref([])
const approvedArtifactColumns = [
  {
    name: 'artefakt_naziv',
    label: 'Naziv artefakta',
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
    name: 'voditelj',
    label: 'Voditelj',
    field: 'voditelj',
    align: 'left',
  },
  {
    name: 'akcije',
    label: 'Akcije',
    field: 'akcije',
    align: 'center',
  },
]

async function fetchApprovedArtifacts() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/admin/approved-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    approvedArtifacts.value = response.data

    console.log('Odobreni artefakti:', approvedArtifacts.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja odobrenih artefakata:', error)
  }
}

const managers = ref([])
async function fetchManagers() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/managers', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    managers.value = response.data
    console.log('Voditelji:', managers.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja voditelja:', error)
  }
}

async function assignManager(row) {
  if (!row.selectedManager) {
    Notify.create({
      type: 'warning',
      message: 'Odaberite voditelja.',
      position: 'center',
    })
    return
  }

  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.put(
      `http://localhost:3000/api/admin/artifacts/${row.artefakt_sifra}/assign-manager`,
      {
        managerId: row.selectedManager,
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

    await fetchApprovedArtifacts()
  } catch (error) {
    console.error('Greška kod dodjele voditelja:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Dodjela nije uspjela.',
      position: 'center',
    })
  }
}

onMounted(() => {
  fetchArtifacts()
  fetchUsers()
  fetchAppraisers()
  fetchAppraisals()
  fetchApprovedArtifacts()
  fetchManagers()
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
