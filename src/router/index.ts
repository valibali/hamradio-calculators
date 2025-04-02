import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ComingSoonView from '../views/ComingSoonView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/formulas',
      name: 'formulas',
      // route level code-splitting
      // this generates a separate chunk (Formulas.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/FormulasView.vue'),
    },
    {
      path: '/calculators',
      name: 'calculators',
      component: () => import('../views/CalculatorsView.vue'),
    },
    // Routes for new sections that will use the ComingSoon component
    {
      path: '/my-story',
      name: 'my-story',
      component: ComingSoonView
    },
    {
      path: '/my-rig',
      name: 'my-rig',
      component: ComingSoonView
    },
    {
      path: '/homebrew',
      name: 'homebrew',
      component: ComingSoonView
    },
    {
      path: '/for-sale',
      name: 'for-sale',
      component: ComingSoonView
    },
    {
      path: '/articles',
      name: 'articles',
      component: ComingSoonView
    },
    {
      path: '/my-log',
      name: 'my-log',
      component: ComingSoonView
    },
    {
      path: '/hamledger',
      name: 'hamledger',
      component: ComingSoonView
    },
    // Catch-all route for any undefined routes
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

export default router
