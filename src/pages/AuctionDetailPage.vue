<template>
  <div
    class="column items-center q-px-xl q-pt-md q-pb-xl"
    style="background-color: #f9f6ef; min-height: 100vh"
  >
    <div class="row q-col-gutter-xl q-mt-sm" style="width: 100%; max-width: 1200px">
      <div class="col-12">
        <div
          class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
          style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
        >
          Detalji aukcije
        </div>
      </div>

      <div class="col-12 col-md-7">
        <q-card class="q-pa-md">
          <div
            class="flex flex-center rounded-borders q-mb-md"
            style="height: 280px; background-color: #f9f6ef; border: 1px solid #d4a017"
          >
            Glavna fotografija
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-4">
              <div
                class="flex flex-center rounded-borders"
                style="height: 90px; background-color: #f9f6ef; border: 1px solid #d4a017"
              >
                Foto 1
              </div>
            </div>

            <div class="col-4">
              <div
                class="flex flex-center rounded-borders"
                style="height: 90px; background-color: #f9f6ef; border: 1px solid #d4a017"
              >
                Foto 2
              </div>
            </div>

            <div class="col-4">
              <div
                class="flex flex-center rounded-borders"
                style="height: 90px; background-color: #f9f6ef; border: 1px solid #d4a017"
              >
                Foto 3
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-md-5">
        <q-card class="q-pa-lg">
          <div
            class="inline-block q-px-md q-py-xs rounded-borders text-white q-mb-md"
            style="background-color: #1e6b4c"
          >
            Satovi
          </div>

          <div class="text-h3 text-dark text-weight-medium">Vintage sat</div>

          <div class="text-body1 text-grey-8 q-mt-sm">Prodavatelj: @antikviteti_ri</div>

          <q-separator class="q-my-lg" />

          <div class="text-body1 q-mb-sm"><strong>Marka:</strong> Omega</div>

          <div class="text-body1 q-mb-sm"><strong>Model:</strong> Seamaster</div>

          <div class="text-body1 q-mb-sm"><strong>Godina proizvodnje:</strong> 1972.</div>

          <div class="text-body1"><strong>Stanje:</strong> očuvano</div>
        </q-card>
      </div>
    </div>

    <div class="q-mt-xl" style="width: 100%; max-width: 1200px">
      <div
        class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md"
        style="background-color: #ffffff; border-left: 5px solid #d4a017"
      >
        Aukcija
      </div>

      <q-card class="q-pa-lg">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-8">Početna cijena</div>
              <div class="text-h6 text-dark">50 €</div>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-8">Trenutna cijena</div>
              <div class="text-h4 text-dark text-weight-bold">75 €</div>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-8">Završava za</div>
              <div class="text-h6 text-dark">2d 14h 23min</div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-4">
            <q-input outlined label="Vaša ponuda (€)" model-value="80" />
          </div>

          <div class="col-auto">
            <q-btn
              color="primary"
              class="q-mb-sm"
              text-color="dark"
              label="Ponudi"
              no-caps
              rounded
              unelevated
            />
          </div>
        </div>
      </q-card>

      <div
        class="text-h5 text-dark q-pa-lg rounded-borders q-mb-md q-mt-xl"
        style="background-color: #ffffff; border-left: 5px solid #1e6b4c"
      >
        Povijest ponuda
      </div>
    </div>
  </div>
</template>

<script setup></script>
