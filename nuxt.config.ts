// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Указываем базовую директорию исходников
  srcDir: 'src/',

  // Включаем необходимые модули
  modules: ['@nuxtjs/tailwindcss'],

  // Отключаем SSR, так как MSW и localStorage работают только в браузере
  ssr: false,

  // Настройки для корректного разрешения путей (~/...) в TypeScript
  typescript: {
    strict: true,
    typeCheck: false // Можно включить true, если хотите строгую проверку при запуске
  },

  // Конфигурация даты совместимости (оставляем вашу или текущую)
  compatibilityDate: '2024-04-03',

  devtools: { enabled: true },

  // Дополнительно: можно явно указать алиасы, если TypeScript будет терять папку mocks
  alias: {
    '~': '/src',
    '@': '/src'
  }
});