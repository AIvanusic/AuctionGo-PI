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
          alt="AuctionGO!-logo"
          style="max-width: 220px; width: 100%"
          class="q-mb-md"
        />

        <div class="text-h3 text-dark text-weight-medium">Registracija</div>

        <div class="text-subtitle1 text-dark q-mt-sm">Kreirajte korisnički račun za AuctionGO!</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="firstName" outlined label="Ime" color="dark" input-class="text-dark" />
        <q-input v-model="lastName" outlined label="Prezime" color="dark" input-class="text-dark" />

        <q-input
          v-model="username"
          outlined
          label="Korisničko ime"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        />

        <q-input
          v-model="email"
          outlined
          label="Email"
          type="email"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
          :rules="[
            (val) => !!val || 'Email je obavezan',
            (val) => /.+@.+\..+/.test(val) || 'Unesite ispravnu email adresu',
          ]"
        />

        <q-input
          v-model="password"
          outlined
          label="Lozinka"
          :type="showPassword ? 'text' : 'password'"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-input
          v-model="confirmPassword"
          outlined
          label="Potvrda lozinke"
          :type="showConfirmPassword ? 'text' : 'password'"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        >
          <template v-slot:append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn
          color="primary"
          text-color="dark"
          label="Registracija"
          no-caps
          unelevated
          rounded
          class="q-px-xl"
          type="button"
          @click="registerUser"
        />
      </q-card-actions>
      <q-card-section class="text-center q-pt-none">
        <div class="text-body2 text-dark">Već imate račun?</div>

        <q-btn flat no-caps color="dark" label="Prijavite se" to="/login" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { Notify } from 'quasar'
import { useRouter } from 'vue-router'

const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()

async function registerUser() {
  if (password.value !== confirmPassword.value) {
    Notify.create({
      type: 'negative',
      message: 'Lozinka i potvrda lozinke nisu jednake.',
      position: 'center',
    })
    return
  }

  try {
    const response = await axios.post('http://localhost:3000/register', {
      firstName: firstName.value,
      lastName: lastName.value,
      username: username.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    })

    Notify.create({
      type: 'positive',
      message: response.data.message,
      position: 'center',
    })

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (error) {
    console.error(error)

    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Registracija nije uspjela.',
      position: 'center',
    })
  }
}

const showPassword = ref(false)
const showConfirmPassword = ref(false)
</script>
