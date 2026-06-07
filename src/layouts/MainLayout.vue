<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title>
          <router-link
            to="/"
            style="
              color: #f9f6ef;
              text-decoration: none;
              font-weight: 700;
              font-size: 1.3rem;
              letter-spacing: 0.7px;
            "
          >
            AuctionGO!
          </router-link>
        </q-toolbar-title>

        <template v-if="!user">
          <q-btn
            color="primary"
            text-color="dark"
            label="Prijava"
            no-caps
            unelevated
            rounded
            to="/login"
            class="q-mr-sm"
          />

          <q-btn
            outline
            color="primary"
            label="Registracija"
            no-caps
            rounded
            to="/register"
            style="color: #f9f6ef"
          />
        </template>

        <template v-else>
          <q-btn flat no-caps icon="person" :label="user.korisnik_username" to="/user-profile" />

          <q-btn outline color="primary" label="Odjava" no-caps rounded @click="logout" />
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const user = ref(JSON.parse(localStorage.getItem('auctiongo_user')))

function logout() {
  localStorage.removeItem('auctiongo_user')
  localStorage.removeItem('auctiongo_token')

  window.location.href = '/'
}
</script>
