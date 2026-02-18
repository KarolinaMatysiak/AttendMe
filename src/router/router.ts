import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import MainAppLayout from '../layouts/MainAppLayout.vue'
import { useAuthStore } from '../stores/auth'

type AppRole = 'teacher' | 'student'

type RouteMetaAccess = {
  guestOnly?: boolean
  requiresAuth?: boolean
  roles?: AppRole[]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: AuthLayout,
      redirect: '/auth/login',
      children: [
        {
          path: 'login',
          name: 'login-page',
          component: () => import('../pages/auth/LoginPage.vue'),
          meta: { guestOnly: true } satisfies RouteMetaAccess,
        },
      ],
    },
    {
      path: '/teacher',
      component: MainAppLayout,
      meta: { requiresAuth: true, roles: ['teacher'] } satisfies RouteMetaAccess,
      children: [
        {
          path: 'dashboard',
          name: 'teacher-dashboard',
          component: () => import('../pages/teacher/TeacherDashboardPage.vue'),
        },
        {
          path: 'sessions/:sessionId',
          name: 'teacher-details',
          component: () => import('../pages/teacher/TeacherDetailsPage.vue'),
        },
        {
          path: 'sessions/:sessionId/scanner',
          name: 'teacher-session-scanner',
          component: () => import('../pages/teacher/TeacherScannerPage.vue'),
        },
      ],
    },
    // {
    //   path: '/student',
    //   component: MainAppLayout,
    //   meta: { requiresAuth: true, roles: ['student'] } satisfies RouteMetaAccess,
    //   children: [
    //     {
    //       path: 'dashboard',
    //       name: 'student-dashboard',
    //       component: () => import('../pages/student/StudentDashboardPage.vue'),
    //     },
    //     {
    //       path: 'sessions/:sessionId',
    //       name: 'student-session-details',
    //       component: () => import('../pages/student/StudentSessionDetailsPage.vue'),
    //     },
    //     {
    //       path: 'attendance/register',
    //       name: 'student-attendance-register',
    //       component: () => import('../pages/student/StudentAttendanceRegisterPage.vue'),
    //     },
    //   ],
    // },
    {
      path: '/device/register/:token',
      name: 'device-register',
      component: () => import('../pages/student/DeviceRegisterPage.vue'),
    },
    // {
    //   path: '/',
    //   redirect: '/auth/login',
    // },
    // {
    //   path: '/:pathMatch(.*)*',
    //   redirect: '/auth/login',
    // },
  ],
})

function defaultRouteForRole(role: AppRole | null): { name: string } {
  if (role === 'teacher') return { name: 'teacher-dashboard' }
  if (role === 'student') return { name: 'student-dashboard' }
  return { name: 'login-page' }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.isAuthInitialized) {
    await auth.initializeAuth()
  }

  const guestOnly = to.matched.some((record) => (record.meta as RouteMetaAccess).guestOnly)
  const requiresAuth = to.matched.some((record) => (record.meta as RouteMetaAccess).requiresAuth)
  const roles = [...to.matched]
    .reverse()
    .map((record) => (record.meta as RouteMetaAccess).roles)
    .find((r) => Array.isArray(r) && r.length > 0)

  if (guestOnly && auth.isAuthenticated) {
    return defaultRouteForRole(auth.role)
  }

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login-page', query: { redirect: to.fullPath } }
  }

  if (roles && (!auth.role || !roles.includes(auth.role))) {
    return defaultRouteForRole(auth.role)
  }

  return true
})

export { router }
