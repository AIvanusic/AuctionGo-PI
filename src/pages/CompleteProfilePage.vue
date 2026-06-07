<template>
  <div
    class="row justify-center items-center q-pa-md"
    style="background-color: #f9f6ef; min-height: 100vh"
  >
    <q-card
      class="q-pa-lg"
      style="
        width: 100%;
        max-width: 480px;
        border: 3px solid #0f172a;
        border-radius: 16px;
        box-shadow: inset 0 0 0 1px #d4a017;
      "
    >
      <q-card-section class="text-center">
        <div class="text-h4 text-dark text-weight-medium">Dovršite profil</div>
        <div class="text-body1 text-dark q-mt-md">
          Za pregled aukcija možete nastaviti koristiti aplikaciju, ali za licitiranje ili prijavu
          predmeta potrebno je dovršiti profil.
        </div>
        <div class="text-subtitle1 text-dark q-mt-sm">
          Unesite podatke potrebne za sudjelovanje u aukcijama u organizaciji AuctionGo!
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="oib"
          outlined
          label="OIB"
          color="dark"
          input-class="text-dark"
          class="q-mb-md"
        />
        <q-input
          v-model="adresa"
          outlined
          label="Adresa"
          color="dark"
          input-class="text-dark"
          class="q-mb-md"
        />
        <q-input
          v-model="mobitel"
          outlined
          label="Mobitel"
          color="dark"
          input-class="text-dark"
          class="q-mb-md"
        />
        <q-input v-model="iban" outlined label="IBAN" color="dark" input-class="text-dark" />
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          outline
          color="dark"
          label="Otvori uvjete korištenja"
          no-caps
          href="/docs/uvjeti-koristenja-v1.pdf"
          target="_blank"
          @click="termsOpened = true"
        />

        <q-checkbox
          v-model="termsAccepted"
          :disable="!termsOpened"
          color="primary"
          label="Pročitala/pročitao sam i prihvaćam uvjete korištenja sustava AuctionGO!"
          class="q-my-md"
        />

        <q-btn
          color="primary"
          text-color="dark"
          label="Dovrši profil"
          no-caps
          unelevated
          rounded
          class="q-px-xl"
          @click="completeProfile"
        />
        <q-btn flat no-caps color="dark" label="Preskoči za sada" to="/" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { Notify } from 'quasar'

const user = JSON.parse(localStorage.getItem('auctiongo_user'))

const termsOpened = ref(false)
const termsAccepted = ref(false)

console.log(user)

const oib = ref('')
const adresa = ref('')
const mobitel = ref('')
const iban = ref('')

async function completeProfile() {
  if (!/^\d{11}$/.test(oib.value)) {
    Notify.create({
      type: 'negative',
      message: 'OIB mora imati točno 11 znamenki.',
      position: 'center',
    })
    return
  }

  if (!/^HR\d{19}$/.test(iban.value)) {
    Notify.create({
      type: 'negative',
      message: 'IBAN mora početi s HR i imati ukupno 21 znak.',
      position: 'center',
    })
    return
  }

  if (!termsAccepted.value) {
    Notify.create({
      type: 'negative',
      message: 'Za dovršetak profila potrebno je prihvatiti uvjete korištenja.',
      position: 'center',
    })
    return
  }

  const token = localStorage.getItem('auctiongo_token')

  const response = await axios.post(
    'http://localhost:3000/complete-profile',
    {
      oib: oib.value,
      adresa: adresa.value,
      mobitel: mobitel.value,
      iban: iban.value,
      uvjetiSifra: 1,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  user.korisnik_verificiran = 'da'
  localStorage.setItem('auctiongo_user', JSON.stringify(user))

  Notify.create({
    type: 'positive',
    message: response.data.message,
    position: 'center',
  })

  setTimeout(() => {
    window.location.href = '/'
  }, 1000)
}
</script>
