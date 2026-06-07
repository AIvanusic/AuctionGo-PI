const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },
      { path: 'auctiondetail', component: () => import('pages/AuctionDetailPage.vue') },
      { path: 'complete-profile', component: () => import('pages/CompleteProfilePage.vue') },
      { path: 'submit-artifact', component: () => import('pages/SubmitArtifactPage.vue') },
      { path: 'user-profile', component: () => import('pages/UserProfilePage.vue') },
      { path: '/admin-dashboard', component: () => import('pages/AdminPage.vue') },
      { path: '/appraiser-dashboard', component: () => import('pages/AppraiserPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
