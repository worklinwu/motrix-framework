import router from '@/router'
import store from '@/store'
// import { getLocaleManager } from '@/components/Locale'
import { commands } from '@/components/CommandManager/instance'

// const i18n = getLocaleManager().getI18n()

const updateSystemTheme = (payload = {}) => {
  const { theme } = payload
  store.dispatch('app/updateSystemTheme', theme)
}

const updateTheme = (payload = {}) => {
  const { theme } = payload
  store.dispatch('preference/updateThemeConfig', theme)
}

const updateTrayFocused = (payload = {}) => {
  const { focused } = payload
  store.dispatch('app/updateTrayFocused', focused)
}

const showAboutPanel = () => {
  store.dispatch('app/showAboutPanel')
}

const navigatePreferences = () => {
  router.push({ path: '/preference' }).catch(err => {
    console.log(err)
  })
}

// const showUnderDevelopmentMessage = () => {
//   Message.info(i18n.t('app.under-development-message'))
// }

const fetchPreference = () => {
  store.dispatch('preference/fetchPreference')
}

commands.register('application:preferences', navigatePreferences)
commands.register('application:about', showAboutPanel)

commands.register('application:update-preference-config', fetchPreference)
commands.register('application:update-system-theme', updateSystemTheme)
commands.register('application:update-theme', updateTheme)
commands.register('application:update-tray-focused', updateTrayFocused)
