<template>
  <div class="q-pa-xl" style="background-color: #f9f6ef; min-height: 100vh">
    <div class="text-h4 text-dark text-weight-medium">Korisnički profil</div>

    <div v-if="user" class="q-mt-lg">
      <div><strong>Ime i prezime:</strong> {{ user.korisnik_ime }} {{ user.korisnik_prezime }}</div>
      <div><strong>Korisničko ime:</strong> {{ user.korisnik_username }}</div>
      <div><strong>Email:</strong> {{ user.korisnik_email }}</div>
      <div>
        <strong>Status verifikacije:</strong>
        <template v-if="user.korisnik_verificiran === 'da'"> Verificiran </template>
        <template v-else>
          Nije verificiran —
          <router-link to="/complete-profile" style="font-weight: bold; text-decoration: none">
            Dovršite profil
          </router-link>
        </template>
      </div>

      <q-btn
        color="primary"
        text-color="dark"
        label="Uredite podatke"
        no-caps
        rounded
        unelevated
        class="q-mt-md"
        @click="editProfileDialog = true"
      />

      <div class="row q-gutter-md q-mb-lg">
        <q-btn
          color="primary"
          text-color="dark"
          label="Prijavite artefakt"
          no-caps
          unelevated
          rounded
          to="/submit-artifact"
          class="q-mt-lg"
        />
        <q-btn
          color="primary"
          text-color="dark"
          label="Katalog aukcija"
          no-caps
          rounded
          unelevated
          to="/auctions"
          class="q-mt-lg"
        />
      </div>
      <div class="q-mt-xl">
        <div class="q-mb-lg">
          <div class="text-h6 text-dark">Moja prodavateljska ocjena</div>

          <div class="cursor-pointer q-mt-sm" @click="myReviewsDialog = true">
            <q-rating :model-value="Number(averageRating)" readonly size="20px" color="amber" />

            <span class="q-ml-sm">
              {{ averageRating }}
              (Prema ocjenama {{ myReviews.length }} korisnika)
            </span>
          </div>
        </div>

        <div class="text-h5 text-dark q-mb-md">Moji artefakti</div>

        <div v-if="artifacts.length === 0" class="text-dark">
          Još nemate prijavljenih artefakata.
        </div>

        <q-table
          v-if="artifacts.length > 0"
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
                label="Detalji"
                no-caps
                size="sm"
                @click="openAuction(props.row)"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-aukcija="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.aukcija_sifra"
                color="primary"
                label="Aukcija"
                no-caps
                size="sm"
                @click="openAuction(props.row)"
              />

              <span v-else>-</span>
            </q-td>
          </template>
          <template v-slot:body-cell-ugovor="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.aukcija_ugovor"
                color="positive"
                label="Pregled ugovora"
                no-caps
                size="sm"
                flat
                @click="openContractDialog(props.row)"
              />

              <div
                v-if="
                  props.row.artefakt_povucen !== 'povucen' &&
                  props.row.artefakt_prodan !== 'prodan' &&
                  props.row.artefakt_zahtjev_povlacenje !== 'da' &&
                  (!props.row.aukcija_sifra ||
                    ['ceka', 'prvi poziv', 'drugi poziv', 'zadnji poziv'].includes(
                      props.row.aukcija_status,
                    ))
                "
                class="q-mt-xs"
              >
                <q-btn
                  flat
                  no-caps
                  size="sm"
                  color="#1e3a5f"
                  :label="props.row.aukcija_sifra ? 'Zatražite povlačenje' : 'Povucite artefakt'"
                  @click="confirmWithdrawArtifact(props.row)"
                />
              </div>
              <div
                v-if="props.row.artefakt_zahtjev_povlacenje === 'da'"
                class="text-grey-5 text-caption"
              >
                Zahtjev za povlačenje poslan
              </div>

              <span
                v-if="
                  !props.row.aukcija_ugovor &&
                  (props.row.artefakt_povucen === 'povucen' ||
                    props.row.artefakt_prodan === 'prodan')
                "
              >
                -
              </span>
            </q-td>
          </template>
        </q-table>
      </div>

      <div class="q-mt-xl">
        <div class="text-h5 text-dark q-mb-md">Moje obavijesti</div>

        <q-table
          :rows="notifications"
          :columns="notificationColumns"
          row-key="obavijest_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-detalji="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.obavijest_aukcija_sifra"
                color="primary"
                label="Detalji"
                no-caps
                size="sm"
                @click="openAuction({ aukcija_sifra: props.row.obavijest_aukcija_sifra })"
              />
              <span v-else>-</span>
            </q-td>
          </template>
        </q-table>
      </div>

      <div class="q-mt-xl">
        <div class="text-h5 text-dark q-mb-md">Aukcije na kojima sudjelujem</div>

        <q-table
          :rows="myAuctions"
          :columns="myAuctionColumns"
          row-key="aukcija_sifra"
          flat
          bordered
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td auto-width>
                <q-btn
                  flat
                  round
                  dense
                  :icon="
                    expandedMyAuctions.includes(props.row.aukcija_sifra)
                      ? 'expand_less'
                      : 'expand_more'
                  "
                  @click="
                    expandedMyAuctions.includes(props.row.aukcija_sifra)
                      ? expandedMyAuctions.splice(
                          expandedMyAuctions.indexOf(props.row.aukcija_sifra),
                          1,
                        )
                      : expandedMyAuctions.push(props.row.aukcija_sifra)
                  "
                />
              </q-td>

              <q-td key="aukcija_naziv" :props="props">
                {{ props.row.aukcija_naziv }}
              </q-td>

              <q-td key="moja_najvisa_ponuda" :props="props">
                {{ formatPrice(props.row.moja_najvisa_ponuda) }}
              </q-td>

              <q-td key="aukcija_cijena_trenutna" :props="props">
                {{ formatPrice(props.row.aukcija_cijena_trenutna) }}
              </q-td>

              <q-td key="aukcija_kraj" :props="props">
                {{ formatTimeLeft(props.row.aukcija_kraj) }}
              </q-td>

              <q-td key="status" :props="props">
                {{ getAuctionStatus(props.row) }}
              </q-td>

              <q-td key="ugovor" :props="props">
                <q-btn
                  v-if="props.row.aukcija_ugovor"
                  color="positive"
                  label="Pregled ugovora"
                  no-caps
                  size="sm"
                  flat
                  @click="openContractDialog(props.row)"
                />
                <span v-else>-</span>
              </q-td>

              <q-td key="akcije" :props="props">
                <q-btn
                  color="primary"
                  label="Detalji"
                  no-caps
                  size="sm"
                  @click="openAuction(props.row)"
                />
              </q-td>
            </q-tr>

            <q-tr v-show="expandedMyAuctions.includes(props.row.aukcija_sifra)" :props="props">
              <q-td colspan="100%">
                <div class="q-pa-md bg-grey-2">
                  <div>
                    <strong>Datum završetka:</strong> {{ formatDateTime(props.row.aukcija_kraj) }}
                  </div>
                  <div>
                    <strong>Konačna cijena:</strong>
                    {{ formatPrice(props.row.aukcija_cijena_konacna) }}
                  </div>
                  <div>
                    <strong>Status završetka:</strong> {{ props.row.aukcija_statusend || '-' }}
                  </div>
                </div>
              </q-td>
            </q-tr>
          </template>

          <template v-slot:body-cell-akcije="props">
            <q-td :props="props">
              <q-btn
                color="primary"
                label="Detalji"
                no-caps
                size="sm"
                @click="openAuction(props.row)"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-ugovor="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.aukcija_ugovor"
                color="positive"
                label="Pregled ugovora"
                no-caps
                size="sm"
                flat
                @click="openContractDialog(props.row)"
              />
              <span v-else> - </span>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
    <div v-else class="q-mt-lg">Za pregled profila potrebno se prijaviti.</div>
  </div>
  <q-dialog v-model="contractDialog">
    <q-card style="min-width: 700px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Ugovor o kupoprodaji</div>
      </q-card-section>

      <q-card-section v-if="selectedContract">
        <p>
          <strong>Artefakt:</strong>
          {{ selectedContract.artefakt_naziv || selectedContract.aukcija_naziv }}
        </p>

        <p>
          <strong>Vrijeme aukcije:</strong>
          <template v-if="selectedContract.aukcija_pocetak && selectedContract.aukcija_kraj">
            {{ formatDateTime(selectedContract.aukcija_pocetak) }} -
            {{ formatDateTime(selectedContract.aukcija_kraj) }}
          </template>
          <template v-else> - </template>
        </p>

        <p>
          <strong>Konačna cijena:</strong>
          {{ formatPrice(selectedContract.aukcija_cijena_konacna) }}
        </p>

        <p class="q-mt-md">
          Kupac se obvezuje platiti ugovoreni iznos, a prodavatelj isporučiti artefakt u stanju
          opisanom u aukciji.
        </p>

        <q-separator class="q-my-md" />

        <div class="text-subtitle1 text-weight-medium q-mb-sm">Dnevnik aktivnosti</div>

        <q-list dense bordered class="rounded-borders text-caption">
          <q-item v-if="selectedContract.aukcija_ugovor === 'da'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Ugovor je kreiran. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_ugovor_kupac_prihvatio === 'da'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Kupac je prihvatio ugovor. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_ugovor_prodavatelj_prihvatio === 'da'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Prodavatelj je prihvatio ugovor. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_kupac_uplatio === 'uplatio'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Kupac je potvrdio uplatu. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_ugovor_potvrdaplacanja === 'placeno'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Prodavatelj je potvrdio primitak uplate. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_ugovor_potvrdaisporuke === 'isporuceno'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Prodavatelj je potvrdio isporuku artefakta. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_kupac_preuzeo === 'preuzeo'">
            <q-item-section avatar>
              <q-icon name="check_circle" color="positive" />
            </q-item-section>
            <q-item-section> Kupac je potvrdio primitak artefakta. </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_ugovor_artefaktodgovara">
            <q-item-section avatar>
              <q-icon
                :name="
                  selectedContract.aukcija_ugovor_artefaktodgovara === 'odgovara opisu'
                    ? 'check_circle'
                    : 'warning'
                "
                :color="
                  selectedContract.aukcija_ugovor_artefaktodgovara === 'odgovara opisu'
                    ? 'positive'
                    : 'negative'
                "
              />
            </q-item-section>
            <q-item-section>
              Artefakt:
              {{ selectedContract.aukcija_ugovor_artefaktodgovara }}.
            </q-item-section>
          </q-item>

          <q-item v-if="selectedContract.aukcija_statusend === 'transakcija zavrsena'">
            <q-item-section avatar>
              <q-icon name="verified" color="positive" />
            </q-item-section>
            <q-item-section> Voditelj je zaključio transakciju. </q-item-section>
          </q-item>
        </q-list>

        <q-btn
          v-if="
            (Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
              selectedContract?.aukcija_ugovor_kupac_prihvatio !== 'da') ||
            (Number(user.korisnik_sifra) === Number(selectedContract?.prodavatelj_sifra) &&
              selectedContract?.aukcija_ugovor_prodavatelj_prihvatio !== 'da')
          "
          color="primary"
          label="Prihvatite ugovor"
          no-caps
          @click="acceptContract"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_ugovor_kupac_prihvatio === 'da' &&
            selectedContract?.aukcija_ugovor_prodavatelj_prihvatio === 'da' &&
            selectedContract?.aukcija_kupac_uplatio !== 'uplatio'
          "
          color="primary"
          label="Potvrdite uplatu"
          no-caps
          @click="confirmPayment(selectedContract)"
        />

        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.prodavatelj_sifra) &&
            selectedContract?.aukcija_kupac_uplatio === 'uplatio' &&
            selectedContract?.aukcija_ugovor_potvrdaplacanja !== 'placeno'
          "
          color="primary"
          label="Potvrdite primitak uplate"
          no-caps
          @click="confirmReceivedPayment(selectedContract)"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.prodavatelj_sifra) &&
            selectedContract?.aukcija_ugovor_potvrdaplacanja === 'placeno' &&
            selectedContract?.aukcija_ugovor_potvrdaisporuke !== 'isporuceno'
          "
          color="primary"
          label="Potvrdite isporuku"
          no-caps
          @click="confirmDelivery(selectedContract)"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_ugovor_potvrdaisporuke === 'isporuceno' &&
            selectedContract?.aukcija_kupac_preuzeo !== 'preuzeo'
          "
          color="primary"
          label="Potvrdite primitak artefakta"
          no-caps
          @click="confirmReceipt(selectedContract)"
        />
        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_kupac_preuzeo === 'preuzeo' &&
            (!selectedContract?.aukcija_ugovor_artefaktodgovara ||
              selectedContract?.aukcija_ugovor_artefaktodgovara === 'nije potvrđeno')
          "
          color="positive"
          label="Odgovara opisu"
          no-caps
          @click="confirmArtifactCondition(selectedContract, 'odgovara opisu')"
        />

        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_kupac_preuzeo === 'preuzeo' &&
            (!selectedContract?.aukcija_ugovor_artefaktodgovara ||
              selectedContract?.aukcija_ugovor_artefaktodgovara === 'nije potvrđeno')
          "
          color="negative"
          label="Ne odgovara opisu"
          no-caps
          @click="confirmArtifactCondition(selectedContract, 'ne odgovara opisu')"
        />

        <q-btn
          v-if="
            Number(user.korisnik_sifra) === Number(selectedContract?.kupac_sifra) &&
            selectedContract?.aukcija_statusend === 'transakcija zavrsena' &&
            !selectedContract?.moja_recenzija_sifra
          "
          color="primary"
          label="Ostavite recenziju"
          no-caps
          @click="openReviewDialog(selectedContract)"
        />

        <q-btn
          v-if="
            selectedContract?.aukcija_statusend === 'transakcija zavrsena' &&
            !selectedContract?.moja_recenzija_sustava_sifra
          "
          color="primary"
          label="Ocijenite AuctionGO"
          no-caps
          @click="openSystemReviewDialog(selectedContract)"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Zatvori" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="reviewDialog">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Recenzija prodavatelja</div>
      </q-card-section>

      <q-card-section>
        <q-rating v-model="reviewForm.ocjena" max="5" size="lg" color="primary" class="q-mb-md" />

        <q-input v-model="reviewForm.komentar" label="Komentar" type="textarea" outlined />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Odustanite" v-close-popup />
        <q-btn color="primary" label="Spremite recenziju" no-caps @click="submitReview" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="myReviewsDialog">
    <q-card style="min-width: 600px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Moje primljene recenzije</div>
      </q-card-section>

      <q-card-section>
        <div v-if="myReviews.length === 0" class="text-grey-7">
          Još nemate primljenih recenzija.
        </div>

        <div v-for="review in myReviews" :key="review.recenzija_sifra" class="q-mb-md">
          <div class="text-weight-medium">
            {{ review.aukcija_naziv || 'Aukcija' }}
          </div>

          <q-rating
            :model-value="Number(review.recenzija_ocjena)"
            readonly
            size="18px"
            color="amber"
          />

          <div v-if="review.recenzija_komentar" class="text-body2 q-mt-xs">
            {{ review.recenzija_komentar }}
          </div>

          <div class="text-caption text-grey-7 q-mt-xs">
            Kupac: {{ review.davatelj_username || 'Korisnik' }}
          </div>

          <q-separator class="q-mt-md" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Zatvorite" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="systemReviewDialog">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Ocijenite AuctionGO!</div>
      </q-card-section>

      <q-card-section>
        <q-rating
          v-model="systemReviewForm.ocjena"
          max="5"
          size="lg"
          color="amber"
          class="q-mb-md"
        />

        <q-input v-model="systemReviewForm.komentar" label="Komentar" type="textarea" outlined />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Odustanite" v-close-popup />
        <q-btn color="primary" label="Spremite recenziju" no-caps @click="submitSystemReview" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="withdrawDialog">
    <q-card style="min-width: 420px">
      <q-card-section>
        <div class="text-h6">Povlačenje artefakta</div>
      </q-card-section>

      <q-card-section v-if="artifactToWithdraw">
        Jeste li sigurni da želite povući artefakt
        <strong>{{ artifactToWithdraw.artefakt_naziv }}</strong
        >?
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Odustanite" v-close-popup />
        <q-btn color="primary" label="Povucite artefakt" no-caps @click="withdrawArtifact" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="editProfileDialog">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Uređivanje podataka</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="profileForm.ime" label="Ime" outlined class="q-mb-md" />

        <q-input v-model="profileForm.prezime" label="Prezime" outlined class="q-mb-md" />

        <q-input v-model="profileForm.email" label="Email" outlined class="q-mb-md" />

        <q-input v-model="profileForm.adresa" label="Adresa" outlined class="q-mb-md" />

        <q-input v-model="profileForm.mobitel" label="Mobitel" outlined class="q-mb-md" />

        <q-input v-model="profileForm.iban" label="IBAN" outlined />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Odustanite" v-close-popup />

        <q-btn color="primary" text-color="dark" label="Spremite" @click="saveProfileChanges" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { socket } from 'src/services/socket'
import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const user = ref(JSON.parse(localStorage.getItem('auctiongo_user')))

const editProfileDialog = ref(false)

const profileForm = ref({
  ime: user.value?.korisnik_ime || '',
  prezime: user.value?.korisnik_prezime || '',
  email: user.value?.korisnik_email || '',
  adresa: user.value?.korisnik_adresa || '',
  mobitel: user.value?.korisnik_mob || '',
  iban: user.value?.korisnik_IBAN || '',
})

async function saveProfileChanges() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.put(
      'http://localhost:3000/api/user/profile',
      {
        ime: profileForm.value.ime,
        prezime: profileForm.value.prezime,
        email: profileForm.value.email,
        adresa: profileForm.value.adresa,
        mobitel: profileForm.value.mobitel,
        iban: profileForm.value.iban,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    user.value = {
      ...user.value,
      ...response.data.user,
    }

    localStorage.setItem('auctiongo_user', JSON.stringify(user.value))

    editProfileDialog.value = false

    console.log('Profil ažuriran.')
  } catch (error) {
    console.error('Greška kod ažuriranja profila:', error)
  }
}

const artifacts = ref([])

const artifactColumns = [
  {
    name: 'naziv',
    label: 'Naziv',
    field: 'artefakt_naziv',
    align: 'left',
  },
  {
    name: 'kategorija',
    label: 'Kategorija',
    field: 'kategorija_naziv',
    align: 'left',
  },
  {
    name: 'status',
    label: 'Status',
    field: (row) => {
      if (row.artefakt_povucen === 'povucen') return 'Povučen'
      if (row.artefakt_odbijen === 'odbijen') return 'Odbijen'

      if (row.aukcija_status === 'zavrsena' && row.aukcija_ugovor) {
        return 'Transakcija u tijeku'
      }

      if (row.aukcija_status === 'zavrsena') {
        return 'Aukcija završena'
      }

      if (['prvi poziv', 'drugi poziv', 'zadnji poziv'].includes(row.aukcija_status)) {
        return 'Na aukciji'
      }

      if (row.aukcija_status === 'ceka') {
        return 'Aukcija zakazana'
      }

      if (row.artefakt_odobren === 'odobren') return 'Odobren'

      return 'Na čekanju procjene'
    },
    align: 'left',
    sortable: true,
  },
  {
    name: 'aukcija_vrijeme',
    label: 'Vrijeme aukcije',
    field: (row) => {
      if (!row.aukcija_pocetak) return '-'

      const pocetak = formatDateTime(row.aukcija_pocetak)

      if (!row.aukcija_kraj) {
        return `${pocetak} -`
      }

      return `${pocetak} - ${formatDateTime(row.aukcija_kraj)}`
    },
    align: 'left',
    sortable: true,
  },
  {
    name: 'ugovor',
    label: 'Ugovor',
    field: 'aukcija_ugovor',
    align: 'center',
  },
  {
    name: 'aukcija',
    label: 'Aukcija',
    field: 'aukcija_sifra',
    align: 'center',
  },
]

const myAuctions = ref([])

async function fetchMyAuctions() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/user/my-auctions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    myAuctions.value = response.data

    console.log('Moje aukcije:', myAuctions.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja mojih aukcija:', error)
  }
}

const expandedMyAuctions = ref([])

const myAuctionColumns = [
  {
    name: 'expand',
    label: '',
    field: 'expand',
    align: 'center',
  },
  {
    name: 'aukcija_naziv',
    label: 'Aukcija',
    field: 'aukcija_naziv',
    align: 'left',
    sortable: true,
  },
  {
    name: 'moja_najvisa_ponuda',
    label: 'Moja ponuda',
    field: 'moja_najvisa_ponuda',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'aukcija_cijena_trenutna',
    label: 'Trenutna cijena',
    field: 'aukcija_cijena_trenutna',
    format: (val) => formatPrice(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'aukcija_kraj',
    label: 'Završava za',
    field: 'aukcija_kraj',
    format: (val) => formatTimeLeft(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: (row) => getAuctionStatus(row),
    align: 'center',
    sortable: true,
  },
  {
    name: 'ugovor',
    label: 'Ugovor',
    field: 'aukcija_ugovor',
    align: 'center',
  },
  {
    name: 'akcije',
    label: 'Detalji',
    field: 'akcije',
    align: 'center',
  },
]

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

function formatDateTime(value) {
  const date = new Date(value)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year}. ${hour}:${minute}`
}

function formatTimeLeft(value) {
  if (!value) {
    return '-'
  }

  const endDate = new Date(value)
  const now = new Date()
  const diff = endDate - now

  if (diff <= 0) {
    return 'Završena'
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${days}d ${hours}s ${minutes}m`
}

function getAuctionStatus(row) {
  const isEnded = new Date(row.aukcija_kraj) <= new Date()

  if (isEnded) {
    if (row.aukcija_statusend === 'bez ponuda') {
      return 'Bez ponuda'
    }

    if (Number(row.moja_najvisa_ponuda) === Number(row.aukcija_cijena_konacna)) {
      return 'Pobijedili ste'
    }

    return 'Aukcija završena'
  }

  if (Number(row.moja_najvisa_ponuda) === Number(row.aukcija_cijena_trenutna)) {
    return 'Vodite'
  }

  return 'Nadmašeni ste'
}

const router = useRouter()

function openAuction(auction) {
  router.push(`/auctiondetail/${auction.aukcija_sifra}`)
}

const notifications = ref([])
async function fetchNotifications() {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/api/user/notifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    notifications.value = response.data

    console.log('Moje obavijesti:', notifications.value)
  } catch (error) {
    console.error('Greška kod dohvaćanja obavijesti:', error)
  }
}

const notificationColumns = [
  {
    name: 'vrijeme',
    label: 'Vrijeme',
    field: 'obavijest_vrijeme',
    format: (val) => formatDateTime(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'aukcija',
    label: 'Aukcija',
    field: 'aukcija_naziv',
    align: 'left',
    sortable: true,
  },
  {
    name: 'naslov',
    label: 'Naslov',
    field: 'obavijest_naslov',
    align: 'left',
    sortable: true,
  },
  {
    name: 'tekst',
    label: 'Obavijest',
    field: 'obavijest_tekst',
    align: 'left',
  },
  {
    name: 'detalji',
    label: 'Detalji',
    field: 'detalji',
    align: 'center',
  },
]

const contractDialog = ref(false)
const selectedContract = ref(null)

function openContractDialog(row) {
  console.log('UGOVOR:', row)
  selectedContract.value = row
  contractDialog.value = true
}

async function acceptContract() {
  if (!selectedContract.value) return

  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${selectedContract.value.aukcija_sifra}/accept-contract`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data
    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod prihvata ugovora:', error)
  }
}

async function confirmPayment(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-payment`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde uplate:', error)
  }
}

async function confirmReceivedPayment(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-received-payment`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    await fetchMyAuctions()
    await fetchNotifications()

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde primitka uplate:', error)
  }
}

async function confirmDelivery(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-delivery`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    await fetchMyAuctions()
    await fetchNotifications()

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde isporuke:', error)
  }
}

async function confirmReceipt(row) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-receipt`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde primitka artefakta:', error)
  }
}

async function confirmArtifactCondition(row, artefaktOdgovara) {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/auctions/${row.aukcija_sifra}/confirm-artifact-condition`,
      { artefaktOdgovara },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()
    await fetchNotifications()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod potvrde stanja artefakta:', error)
  }
}

const reviewDialog = ref(false)
const reviewForm = ref({
  ocjena: null,
  komentar: '',
})
function openReviewDialog(row) {
  selectedContract.value = row

  reviewForm.value = {
    ocjena: null,
    komentar: '',
  }

  reviewDialog.value = true
}

async function submitReview() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.post(
      'http://localhost:3000/api/reviews',
      {
        aukcijaSifra: selectedContract.value.aukcija_sifra,
        primateljSifra: selectedContract.value.prodavatelj_sifra,
        ocjena: reviewForm.value.ocjena,
        komentar: reviewForm.value.komentar,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    await fetchMyAuctions()
    reviewDialog.value = false
  } catch (error) {
    console.error('Greška kod spremanja recenzije:', error)
  }
}

const myReviews = ref([])
const myReviewsDialog = ref(false)

async function fetchMyReviews() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.get('http://localhost:3000/api/user/my-reviews', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    myReviews.value = response.data
    console.log('Moje primljene recenzije:', myReviews.value)
    console.log('Prijavljeni korisnik:', user.value.korisnik_sifra)
  } catch (error) {
    console.error('Greška kod dohvaćanja mojih recenzija:', error)
  }
}

const averageRating = computed(() => {
  if (myReviews.value.length === 0) {
    return 0
  }

  const sum = myReviews.value.reduce((acc, review) => acc + Number(review.recenzija_ocjena), 0)

  return (sum / myReviews.value.length).toFixed(1)
})

const systemReviewDialog = ref(false)
const systemReviewForm = ref({
  ocjena: null,
  komentar: '',
})

function openSystemReviewDialog(row) {
  selectedContract.value = row

  systemReviewForm.value = {
    ocjena: null,
    komentar: '',
  }

  systemReviewDialog.value = true
}

async function submitSystemReview() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.post(
      'http://localhost:3000/api/system-reviews',
      {
        ocjena: systemReviewForm.value.ocjena,
        komentar: systemReviewForm.value.komentar,
        aukcijaSifra: selectedContract.value.aukcija_sifra,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    await fetchMyAuctions()

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    systemReviewDialog.value = false
    contractDialog.value = false
  } catch (error) {
    console.error('Greška kod spremanja recenzije sustava:', error)
  }
}

const withdrawDialog = ref(false)
const artifactToWithdraw = ref(null)

function confirmWithdrawArtifact(row) {
  artifactToWithdraw.value = row
  withdrawDialog.value = true
}

async function withdrawArtifact() {
  if (!artifactToWithdraw.value) return

  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/artifacts/${artifactToWithdraw.value.artefakt_sifra}/withdraw`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data

    withdrawDialog.value = false
    artifactToWithdraw.value = null
  } catch (error) {
    console.error('Greška kod povlačenja artefakta:', error)
  }
}

onMounted(async () => {
  const token = localStorage.getItem('auctiongo_token')

  try {
    const response = await axios.get('http://localhost:3000/my-artifacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    artifacts.value = response.data
    console.log('Artefakti:', artifacts.value)
    console.log(
      'Slika:',
      artifacts.value.find((a) => a.artefakt_sifra === 6),
    )
  } catch (error) {
    console.error('Greška kod dohvaćanja artefakata:', error)
  }

  await fetchNotifications()
  await fetchMyAuctions()
  await fetchMyReviews()
})

socket.on('bid-updated', async () => {
  await fetchMyAuctions()
  await fetchNotifications()
  await fetchMyReviews()
})

socket.on('auction-closed', async () => {
  await fetchMyAuctions()
  await fetchNotifications()
})

onUnmounted(() => {
  socket.off('bid-updated')
  socket.off('auction-closed')
})
</script>
