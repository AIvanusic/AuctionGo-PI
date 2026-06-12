<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-lg">Voditeljska ploča</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1">Moji artefakti za aukciju</div>
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
            label="Kreirajte aukciju"
            no-caps
            dense
            @click="openAuctionDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="contractDialog">
      <q-card style="min-width: 700px">
        <q-card-section>
          <div class="text-h6">Ugovor o kupoprodaji</div>
        </q-card-section>

        <q-card-section v-if="selectedContract">
          <p>
            <strong>Artefakt:</strong>
            {{ selectedContract.artefakt_naziv }}
          </p>

          <p>
            <strong>Prodavatelj:</strong>
            {{ selectedContract.prodavatelj_ime }}
            {{ selectedContract.prodavatelj_prezime }}
          </p>

          <p>
            <strong>Kupac:</strong>
            {{ selectedContract.kupac_ime }}
            {{ selectedContract.kupac_prezime }}
          </p>

          <p>
            <strong>Dogovorena cijena:</strong>
            {{ formatPrice(selectedContract.aukcija_cijena_konacna) }}
          </p>

          <p class="q-mt-md">
            Kupac se obvezuje platiti ugovoreni iznos, a prodavatelj isporučiti artefakt u stanju
            opisanom u aukciji.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Zatvori" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="section-title q-mt-xl q-mb-md">Završene aukcije</div>

    <q-table
      :rows="completedAuctions"
      :columns="completedAuctionColumns"
      row-key="aukcija_sifra"
      flat
      bordered
      :pagination="{ rowsPerPage: 10 }"
      :rows-per-page-options="[5, 10, 20, 50, 0]"
    >
      <template v-slot:body-cell-akcije="props">
        <q-td :props="props">
          <q-btn
            v-if="!props.row.aukcija_ugovor"
            color="primary"
            label="Izradi ugovor"
            no-caps
            dense
            @click="generateContract(props.row)"
          />

          <q-btn
            v-else
            color="grey-7"
            label="Pregled ugovora"
            no-caps
            dense
            flat
            @click="openContractDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <div class="text-caption text-grey-7 q-mt-sm">
      <strong>Tijek transakcije:</strong>
      Čeka ugovor → Čeka prihvat kupca → Čeka prihvat prodavatelja → Čeka uplatu → Čeka isporuku →
      Čeka potvrdu primitka → Završeno
    </div>

    <q-dialog v-model="auctionDialog">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Kreiranje aukcije</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="auctionForm.aukcija_naziv"
            label="Naziv aukcije"
            outlined
            class="q-mb-md"
          />

          <q-input
            v-model="auctionForm.aukcija_cijena_pocetna"
            type="number"
            label="Početna cijena (€)"
            outlined
            class="q-mb-md"
          />

          <q-input
            v-model="auctionForm.aukcija_cijena_rezervirana"
            type="number"
            label="Rezervirana cijena (€)"
            outlined
            class="q-mb-md"
          />

          <q-input
            v-model="auctionForm.aukcija_pocetak"
            type="datetime-local"
            label="Početak aukcije"
            outlined
            class="q-mb-md"
          />

          <q-input
            v-model="auctionForm.aukcija_kraj"
            type="datetime-local"
            label="Završetak aukcije"
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Odustanite" v-close-popup />

          <q-btn color="primary" label="Kreirajte aukciju" @click="createAuction" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { Notify, useQuasar } from 'quasar'

const $q = useQuasar()
const artifacts = ref([])

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
    name: 'procjena_cijena_procijenjena',
    label: 'Procjena',
    field: 'procjena_cijena_procijenjena',
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
    const response = await axios.get('http://localhost:3000/api/manager/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data
    console.log('Artefakti voditelja:', artifacts.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata voditelja:', error)
  }
}

const selectedArtifact = ref(null)

const auctionDialog = ref(false)

const auctionForm = ref({
  aukcija_naziv: '',
  aukcija_cijena_pocetna: null,
  aukcija_cijena_rezervirana: null,
  aukcija_pocetak: '',
  aukcija_kraj: '',
})

function openAuctionDialog(row) {
  selectedArtifact.value = row

  auctionForm.value = {
    aukcija_naziv: row.artefakt_naziv,
    aukcija_cijena_pocetna: row.artefakt_cijena_trazena || null,
    aukcija_cijena_rezervirana: row.artefakt_cijena_trazena || null,
    aukcija_pocetak: '',
    aukcija_kraj: '',
  }

  auctionDialog.value = true
}

async function createAuction() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.post(
      `http://localhost:3000/api/manager/artifacts/${selectedArtifact.value.artefakt_sifra}/create-auction`,
      auctionForm.value,
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

    auctionDialog.value = false

    await fetchArtifacts()
  } catch (error) {
    console.error('Greška kod kreiranja aukcije:', error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Kreiranje aukcije nije uspjelo.',
      position: 'center',
    })
  }
}

const completedAuctions = ref([])
async function fetchCompletedAuctions() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.get('http://localhost:3000/api/manager/completed-auctions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    completedAuctions.value = response.data
  } catch (error) {
    console.error('Greška kod dohvaćanja završenih aukcija:', error)
  }
}

const completedAuctionColumns = [
  {
    name: 'artefakt_naziv',
    label: 'Artefakt',
    field: 'artefakt_naziv',
    align: 'left',
    sortable: true,
  },
  {
    name: 'prodavatelj',
    label: 'Prodavatelj',
    field: (row) => `${row.prodavatelj_ime} ${row.prodavatelj_prezime}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'kupac',
    label: 'Kupac',
    field: (row) => `${row.kupac_ime} ${row.kupac_prezime}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'aukcija_cijena_konacna',
    label: 'Konačna cijena',
    field: 'aukcija_cijena_konacna',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'status_transakcija',
    label: 'Status transakcije',
    field: (row) => getTransactionStatus(row),
    align: 'center',
    sortable: true,
  },
  {
    name: 'akcije',
    label: 'Akcije',
    align: 'center',
  },
]

async function generateContract(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/manager/auctions/${row.aukcija_sifra}/generate-contract`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchCompletedAuctions()

    $q.notify({
      type: 'positive',
      message: 'Ugovor je uspješno generiran.',
    })
  } catch (error) {
    console.error('Greška kod generiranja ugovora:', error)

    $q.notify({
      type: 'negative',
      message: 'Greška kod generiranja ugovora.',
    })
  }
}

const contractDialog = ref(false)
const selectedContract = ref(null)

function openContractDialog(row) {
  selectedContract.value = row
  contractDialog.value = true
}

function getTransactionStatus(row) {
  if (!row.aukcija_ugovor) {
    return 'Čeka ugovor'
  }

  if (row.aukcija_ugovor_kupac_prihvatio !== 'da') {
    return 'Čeka prihvat kupca'
  }

  if (row.aukcija_ugovor_prodavatelj_prihvatio !== 'da') {
    return 'Čeka prihvat prodavatelja'
  }

  return 'Čeka uplatu'
}

onMounted(() => {
  fetchArtifacts()
  fetchCompletedAuctions()
})
</script>

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
