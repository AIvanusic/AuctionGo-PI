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
            AuctionGO
          </router-link>
        </q-toolbar-title>

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
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup></script>
