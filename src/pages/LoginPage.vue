<template>
  <div
    class="row justify-center items-center q-pa-md"
    style="background-color: #f9f6ef; min-height: 100vh"
  >
    <q-card
      class="q-pa-lg"
      style="
        width: 100%;
        max-width: 420px;
        border: 3px solid #0f172a;
        border-radius: 16px;
        box-shadow: inset 0 0 0 1px #d4a017;
      "
    >
      <q-card-section class="text-center">
        <img
          src="../assets/CleanLogoAukcijeGo.png"
          alt="AuctionGO"
          style="max-width: 220px; width: 100%"
          class="q-mb-md"
        />
        <div class="text-h3 text-dark text-weight-medium">Prijava</div>
        <div class="text-subtitle1 text-dark q-mt-sm">Prijavite se u AuctionGO! sustav</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="login"
          outlined
          label="Korisničko ime ili email"
          color="dark"
          input-class="text-dark"
          class="q-mb-md"
        />

        <q-input
          v-model="password"
          outlined
          label="Lozinka"
          color="dark"
          input-class="text-dark"
          :type="showPassword ? 'text' : 'password'"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="primary"
          text-color="dark"
          label="Prijava"
          no-caps
          unelevated
          rounded
          class="q-px-xl"
          @click="loginUser"
        />
      </q-card-actions>

      <q-card-section class="text-center q-pt-none">
        <div class="text-body2 text-dark">Još nemate račun?</div>

        <q-btn flat no-caps color="dark" label="Registrirajte se" to="/register" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { Notify } from 'quasar'
import { redirectByRole } from '../utils/redirectByRole'

const login = ref('')
const password = ref('')

const showPassword = ref(false)

async function loginUser() {
  try {
    const response = await axios.post('http://localhost:3000/login', {
      login: login.value,
      password: password.value,
    })

    console.log(response.data)
    localStorage.setItem('auctiongo_user', JSON.stringify(response.data.user))
    localStorage.setItem('auctiongo_token', response.data.token)

    Notify.create({
      type: 'positive',
      message: response.data.message,
      position: 'center',
    })

    setTimeout(() => {
      redirectByRole(response.data.user)
    }, 1000)
  } catch (error) {
    console.error(error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Prijava nije uspjela.',
      position: 'center',
    })
  }
}
</script>
