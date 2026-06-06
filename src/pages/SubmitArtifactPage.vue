<template>
  <div
    class="row justify-center items-center q-pa-md"
    style="background-color: #f9f6ef; min-height: 100vh"
  >
    <q-card
      class="q-pa-lg"
      style="
        width: 100%;
        max-width: 600px;
        border: 3px solid #0f172a;
        border-radius: 16px;
        box-shadow: inset 0 0 0 1px #d4a017;
      "
    >
      <q-card-section class="text-center">
        <div class="text-h4 text-dark text-weight-medium">Prijava artefakta</div>

        <div class="text-subtitle1 text-dark q-mt-sm">
          Unesite podatke o artefaktu koji želite poslati na procjenu.
        </div>
      </q-card-section>
      <div class="text-body2 text-center text-grey-8 q-mb-md">
        Polja označena zvjezdicom (*) obavezna su za slanje artefakta na procjenu.
      </div>
      <q-card-section>
        <q-input v-model="naziv" outlined label="Naziv artefakta *" class="q-mb-md" />

        <q-input v-model="marka" outlined label="Marka" class="q-mb-md" />

        <q-input v-model="model" outlined label="Model" class="q-mb-md" />

        <q-input
          v-model="datumProizvodnje"
          outlined
          label="Vrijeme / godina proizvodnje"
          hint="Npr. 1972., oko 1930., 19. stoljeće ili nepoznato"
          class="q-mb-md"
        />

        <q-select
          v-model="kategorija"
          outlined
          label="Kategorija *"
          :options="kategorije"
          class="q-mb-md"
        />

        <q-select
          v-model="stanje"
          outlined
          label="Stanje artefakta *"
          :options="stanja"
          class="q-mb-md"
        />

        <div class="text-body2 text-grey-8 q-mb-xs">
          Dodajte informacije koje nisu obuhvaćene prethodnim poljima, primjerice povijest
          artefakta, zanimljivosti, posebna obilježja ili poznata oštećenja.
        </div>

        <q-input v-model="opis" outlined type="textarea" label="Opis artefakta *" class="q-mb-lg" />

        <q-input
          v-model="trazenaCijena"
          outlined
          label="Tražena cijena (€)"
          type="number"
          class="q-mb-md"
        />

        <q-input
          v-model="dokazVlasnistva"
          outlined
          type="textarea"
          label="Dokaz vlasništva / podrijetlo artefakta"
          hint="Navedite na temelju čega dokazujete vlasništvo nad artefaktom, npr. račun, nasljedstvo, darovni ugovor, obiteljsko vlasništvo ili prethodna kupnja. Dokumente će po potrebi zatražiti procjenitelj."
          class="q-mb-md"
        />
      </q-card-section>

      <div
        class="q-pa-md q-mb-md rounded-borders"
        style="border: 1px dashed #d4a017; background-color: #fffdf8"
      >
        <div class="text-subtitle1 text-dark q-mb-sm">Fotografije artefakta</div>

        <q-file
          v-model="fotografije"
          outlined
          multiple
          accept="image/*"
          label="Odaberite fotografije *"
          hint="Možete dodati od 1 do 3 fotografije, najviše 1 MB po fotografiji."
          max-files="3"
          max-file-size="1048576"
        />
      </div>

      <q-card-actions align="center">
        <q-btn
          color="primary"
          text-color="dark"
          label="Pošaljite na procjenu"
          no-caps
          unelevated
          rounded
          @click="submitArtifact"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import { useRouter } from 'vue-router'

const router = useRouter()
const naziv = ref('')
const opis = ref('')
const marka = ref('')
const model = ref('')
const datumProizvodnje = ref('')
const kategorija = ref(null)
const stanje = ref('')
const trazenaCijena = ref('')
const dokazVlasnistva = ref('')
const fotografije = ref([])
const kategorije = ref([])
const stanja = [
  'Izvrsno',
  'Vrlo dobro',
  'Dobro',
  'Zadovoljavajuće',
  'Potrebna restauracija',
  'Neispravno',
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}

async function submitArtifact() {
  if (!naziv.value) {
    Notify.create({
      type: 'negative',
      message: 'Naziv artefakta je obavezan.',
      position: 'center',
    })
    return
  }

  if (!kategorija.value) {
    Notify.create({
      type: 'negative',
      message: 'Kategorija je obavezna.',
      position: 'center',
    })
    return
  }

  if (!stanje.value) {
    Notify.create({
      type: 'negative',
      message: 'Stanje artefakta je obavezno.',
      position: 'center',
    })
    return
  }

  if (!opis.value) {
    Notify.create({
      type: 'negative',
      message: 'Opis artefakta je obavezan.',
      position: 'center',
    })
    return
  }

  if (fotografije.value.length === 0) {
    Notify.create({
      type: 'negative',
      message: 'Potrebno je dodati najmanje jednu fotografiju artefakta.',
      position: 'center',
    })
    return
  }

  const user = JSON.parse(localStorage.getItem('auctiongo_user'))
  const fotografijeBase64 = await Promise.all(fotografije.value.map((foto) => fileToBase64(foto)))

  const token = localStorage.getItem('auctiongo_token')

  const response = await axios.post(
    'http://localhost:3000/artifact',
    {
      naziv: naziv.value,
      opis: opis.value,
      marka: marka.value,
      model: model.value,
      datumProizvodnje: datumProizvodnje.value,
      kategorijaSifra: kategorija.value.value,
      stanje: stanje.value,
      trazenaCijena: trazenaCijena.value,
      dokazVlasnistva: dokazVlasnistva.value,
      korisnikSifra: user.korisnik_sifra,
      fotografije: fotografijeBase64,
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

  naziv.value = ''
  opis.value = ''
  marka.value = ''
  model.value = ''
  datumProizvodnje.value = ''
  kategorija.value = null
  stanje.value = null
  trazenaCijena.value = ''
  dokazVlasnistva.value = ''
  fotografije.value = []

  setTimeout(() => {
    router.push('/')
    location.reload()
  }, 1000)

  console.log(response.data)

  console.log('Broj fotografija:', fotografije.value.length)

  fotografije.value.forEach((foto, index) => {
    console.log(`Fotografija ${index + 1}:`)
    console.log(foto.name)
    console.log(foto.size)
    console.log(foto.type)
  })
}

async function loadCategories() {
  const response = await axios.get('http://localhost:3000/categories')

  kategorije.value = response.data.map((category) => ({
    label: category.kategorija_naziv,
    value: category.kategorija_sifra,
  }))
}

onMounted(() => {
  loadCategories()
})
</script>
