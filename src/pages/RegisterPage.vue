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

        <div class="text-h3 text-dark text-weight-medium">Registracija</div>

        <div class="text-subtitle1 text-dark q-mt-sm">Kreirajte korisnički račun za AuctionGO</div>
      </q-card-section>

      <q-card-section>
        <q-input outlined label="Ime i prezime" color="dark" input-class="text-dark" />
        <q-input
          outlined
          label="Email"
          type="email"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        />

        <q-input
          outlined
          label="Korisničko ime"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        />

        <q-input
          outlined
          label="Lozinka"
          type="password"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        />

        <q-input
          outlined
          label="Potvrda lozinke"
          type="password"
          color="dark"
          input-class="text-dark"
          class="q-mt-md"
        />
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
        />
      </q-card-actions>
      <q-card-section class="text-center q-pt-none">
        <div class="text-body2 text-dark">Već imate račun?</div>

        <q-btn flat no-caps color="dark" label="Prijavite se" to="/login" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup></script>
