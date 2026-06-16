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
          <q-btn v-if="showUserNotifications" flat round dense icon="notifications" color="primary">
            <q-badge v-if="unreadCount > 0" color="negative" floating>
              {{ unreadCount }}
            </q-badge>

            <q-menu>
              <q-list style="min-width: 320px; max-width: 420px">
                <q-item-label header>Obavijesti</q-item-label>

                <q-item clickable @click="markAllNotificationsAsRead">
                  <q-item-section>
                    <q-item-label class="text-primary"> Označi sve kao pročitano </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="recentNotifications.length === 0">
                  <q-item-section>
                    <q-item-label>Nema obavijesti.</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item
                  v-for="notification in recentNotifications"
                  :key="notification.obavijest_sifra"
                  clickable
                  @click="markNotificationAsRead(notification)"
                  :style="
                    notification.obavijest_procitana === 'ne'
                      ? 'background-color: #f9f6ef; font-weight: 600'
                      : 'opacity: 0.65'
                  "
                >
                  <q-item-section>
                    <q-item-label>
                      {{ notification.obavijest_naslov }}
                    </q-item-label>

                    <q-item-label caption>
                      {{ notification.obavijest_tekst }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <q-btn
            flat
            no-caps
            style="color: #f9f6ef"
            icon="person"
            :label="user.korisnik_username"
            @click="goToUserArea"
          />

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { redirectByRole } from '../utils/redirectByRole'
import axios from 'axios'
import { socket } from 'src/services/socket'

const user = ref(JSON.parse(localStorage.getItem('auctiongo_user')))

function goToUserArea() {
  redirectByRole(user.value)
}

function logout() {
  localStorage.removeItem('auctiongo_user')
  localStorage.removeItem('auctiongo_token')

  window.location.href = '/'
}

const unreadCount = ref(0)
const recentNotifications = ref([])

const showUserNotifications = computed(() => {
  return (
    user.value &&
    (user.value.korisnik_kupac === 'da' || user.value.korisnik_prodavatelj === 'da') &&
    user.value.korisnik_admin !== 'da' &&
    user.value.korisnik_voditelj !== 'da' &&
    user.value.korisnik_procjenitelj !== 'da'
  )
})

async function fetchUnreadCount() {
  if (!showUserNotifications.value) return

  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.get('http://localhost:3000/api/user/notifications/unread-count', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    unreadCount.value = response.data.unreadCount
  } catch (error) {
    console.error('Greška kod dohvaćanja broja nepročitanih obavijesti:', error)
  }
}

async function fetchRecentNotifications() {
  if (!showUserNotifications.value) return

  try {
    const token = localStorage.getItem('auctiongo_token')

    const response = await axios.get('http://localhost:3000/api/user/notifications/recent', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    recentNotifications.value = response.data
  } catch (error) {
    console.error('Greška kod dohvaćanja zadnjih obavijesti:', error)
  }
}

async function markNotificationAsRead(notification) {
  if (notification.obavijest_procitana === 'da') return

  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      `http://localhost:3000/api/user/notifications/${notification.obavijest_sifra}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    notification.obavijest_procitana = 'da'
    await fetchUnreadCount()
  } catch (error) {
    console.error('Greška kod označavanja obavijesti kao pročitane:', error)
  }
}

async function markAllNotificationsAsRead() {
  try {
    const token = localStorage.getItem('auctiongo_token')

    await axios.put(
      'http://localhost:3000/api/user/notifications/read-all',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    recentNotifications.value.forEach((notification) => {
      notification.obavijest_procitana = 'da'
    })

    unreadCount.value = 0
  } catch (error) {
    console.error('Greška kod označavanja svih obavijesti kao pročitanih:', error)
  }
}

onMounted(async () => {
  await fetchUnreadCount()
  await fetchRecentNotifications()
})

socket.on('notification-created', async (data) => {
  if (Number(data.userId) === Number(user.value?.korisnik_sifra)) {
    await fetchUnreadCount()
    await fetchRecentNotifications()
  }
})

onUnmounted(() => {
  socket.off('notification-created')
})
</script>
