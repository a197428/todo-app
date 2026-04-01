export default defineNuxtPlugin(async () => {
  if (!import.meta.dev) return

  try {
    const { worker } = await import('../msw-mocks/browser')

    await worker.start({
      onUnhandledRequest: 'bypass',
    })

    console.log('✅ [MSW] Mocking enabled.')
  } catch (err) {
    console.error('❌ [MSW] Ошибка старта:', err)
  }
})

