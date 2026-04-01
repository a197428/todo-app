export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  if (to.path === '/login' && isAuthenticated.value) {
    return navigateTo('/')
  }

  if (to.path !== '/login' && !isAuthenticated.value) {
    return navigateTo('/login')
  }
})
