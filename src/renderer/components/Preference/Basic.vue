<template>
  <el-container class="content panel" direction="vertical">
    <el-header class="panel-header" height="84">
      <h4 class="hidden-xs-only">{{ title }}</h4>
      <mo-subnav-switcher
        :title="title"
        :subnavs="subnavs"
        class="hidden-sm-and-up"
      />
    </el-header>
    <el-main class="panel-content">
      <el-form
        class="form-preference"
        ref="basicForm"
        label-position="right"
        size="mini"
        :model="form"
        :rules="rules"
      >
        <el-form-item
          :label="`${$t('preferences.appearance')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <mo-theme-switcher
              v-model="form.theme"
              @change="handleThemeChange"
              ref="themeSwitcher"
            />
          </el-col>
          <el-col v-if="showHideAppMenuOption" class="form-item-sub" :span="16">
            <el-checkbox v-model="form.hideAppMenu">
              {{ $t('preferences.hide-app-menu') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="16">
            <el-checkbox v-model="form.autoHideWindow">
              {{ $t('preferences.auto-hide-window') }}
            </el-checkbox>
          </el-col>
        </el-form-item>
        <el-form-item
          v-if="isMac"
          :label="`${$t('preferences.run-mode')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <el-select v-model="form.runMode">
              <el-option
                v-for="item in runModes"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.language')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="16">
            <el-select
              v-model="form.locale"
              @change="handleLocaleChange"
              :placeholder="$t('preferences.change-language')">
              <el-option
                v-for="item in locales"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.startup')}: `"
          :label-width="formLabelWidth"
        >
          <el-col
            class="form-item-sub"
            :span="24"
            v-if="!isLinux"
          >
            <el-checkbox v-model="form.openAtLogin">
              {{ $t('preferences.open-at-login') }}
            </el-checkbox>
          </el-col>
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.keepWindowState">
              {{ $t('preferences.keep-window-state') }}
            </el-checkbox>
          </el-col>
        </el-form-item>
        <el-form-item
          :label="`${$t('preferences.default-dir')}: `"
          :label-width="formLabelWidth"
        >
          <el-input placeholder="" v-model="form.dir" :readonly="isMas">
            <mo-select-directory
              v-if="isRenderer"
              slot="append"
              @selected="onDirectorySelected"
            />
          </el-input>
          <div class="el-form-item__info" v-if="isMas" style="margin-top: 8px;">
            {{ $t('preferences.mas-default-dir-tips') }}
          </div>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button
          type="primary"
          @click="submitForm('basicForm')"
        >
          {{ $t('preferences.save') }}
        </el-button>
        <el-button
          @click="resetForm('basicForm')"
        >
          {{ $t('preferences.discard') }}
        </el-button>
      </div>
    </el-main>
  </el-container>
</template>

<script>
  import is from 'electron-is'
  import { dialog } from '@electron/remote'
  import { mapState } from 'vuex'
  import { cloneDeep, extend, isEmpty } from 'lodash'
  import SubnavSwitcher from '@/components/Subnav/SubnavSwitcher'
  import SelectDirectory from '@/components/Native/SelectDirectory'
  import ThemeSwitcher from '@/components/Preference/ThemeSwitcher'
  import { availableLanguages, getLanguage } from '@shared/locales'
  import { getLocaleManager } from '@/components/Locale'
  import {
    backupConfig,
    calcFormLabelWidth,
    changedConfig,
    checkIsNeedRestart,
    diffConfig
  } from '@shared/utils'
  import { APP_RUN_MODE } from '@shared/constants'

  const initForm = (config) => {
    const {
      autoHideWindow,
      dir,
      hideAppMenu,
      keepWindowState,
      locale,
      openAtLogin,
      runMode,
      theme
    } = config
    const result = {
      autoHideWindow,
      dir,
      hideAppMenu,
      keepWindowState,
      locale,
      openAtLogin,
      runMode,
      theme
    }
    return result
  }

  export default {
    name: 'mo-preference-basic',
    components: {
      [SubnavSwitcher.name]: SubnavSwitcher,
      [SelectDirectory.name]: SelectDirectory,
      [ThemeSwitcher.name]: ThemeSwitcher
    },
    data () {
      const { locale } = this.$store.state.preference.config
      const formOriginal = initForm(this.$store.state.preference.config)
      let form = {}
      form = initForm(extend(form, formOriginal, changedConfig.basic))

      if (backupConfig.theme === undefined) {
        backupConfig.theme = formOriginal.theme
      } else {
        formOriginal.theme = backupConfig.theme
      }
      backupConfig.locale = formOriginal.locale

      return {
        form,
        formLabelWidth: calcFormLabelWidth(locale),
        formOriginal,
        locales: availableLanguages,
        rules: {}
      }
    },
    computed: {
      isRenderer: () => is.renderer(),
      isMac: () => is.macOS(),
      isMas: () => is.mas(),
      isLinux () { return is.linux() },
      title () {
        return this.$t('preferences.basic')
      },
      runModes () {
        return [
          {
            label: this.$t('preferences.run-mode-standard'),
            value: 1
          },
          {
            label: this.$t('preferences.run-mode-menu-bar'),
            value: 2
          }
        ]
      },
      subnavs () {
        return [
          {
            key: 'basic',
            title: this.$t('preferences.basic'),
            route: '/preference/basic'
          },
          {
            key: 'advanced',
            title: this.$t('preferences.advanced'),
            route: '/preference/advanced'
          }
        ]
      },
      showHideAppMenuOption () {
        return is.windows() || is.linux()
      },
      ...mapState('preference', {
        config: state => state.config
      })
    },
    methods: {
      handleLocaleChange (locale) {
        const lng = getLanguage(locale)
        getLocaleManager().changeLanguage(lng)
        this.$electron.ipcRenderer.send('command',
                                        'application:change-locale', lng)
      },
      handleThemeChange (theme) {
        this.form.theme = theme
        this.$electron.ipcRenderer.send('command',
                                        'application:change-theme', theme)
      },
      onDirectorySelected (dir) {
        this.form.dir = dir
      },
      syncFormConfig () {
        this.$store.dispatch('preference/fetchPreference')
          .then((config) => {
            this.form = initForm(config)
            this.formOriginal = cloneDeep(this.form)
          })
      },
      submitForm (formName) {
        this.$refs[formName].validate((valid) => {
          if (!valid) {
            console.error('[Motrix] preference form valid:', valid)
            return false
          }

          const data = {
            ...diffConfig(this.formOriginal, this.form),
            ...changedConfig.advanced
          }

          const { runMode, openAtLogin, autoHideWindow } = data

          console.log('[Motrix] preference changed data:', data)

          this.$store.dispatch('preference/save', data)
            .then(() => {
              this.syncFormConfig()
              this.$msg.success(this.$t('preferences.save-success-message'))
            })
            .catch(() => {
              this.$msg.success(this.$t('preferences.save-fail-message'))
            })

          changedConfig.basic = {}
          changedConfig.advanced = {}

          if (this.isRenderer) {
            this.$electron.ipcRenderer.send('command',
                                            'application:open-at-login', openAtLogin)

            if ('runMode' in data) {
              this.$electron.ipcRenderer.send('command',
                                              'application:toggle-dock', runMode === APP_RUN_MODE.STANDARD)
            }

            if ('autoHideWindow' in data) {
              this.$electron.ipcRenderer.send('command',
                                              'application:auto-hide-window', autoHideWindow)
            }

            if (checkIsNeedRestart(data)) {
              this.$electron.ipcRenderer.send('command',
                                              'application:relaunch')
            }

            if (checkIsNeedRestart(data)) {
              this.$electron.ipcRenderer.send('command', 'application:relaunch')
            }
          }
        })
      },
      resetForm (formName) {
        this.$refs.themeSwitcher.currentValue = backupConfig.theme
        this.handleLocaleChange(this.formOriginal.locale)
        this.syncFormConfig()
      }
    },
    beforeRouteLeave (to, from, next) {
      changedConfig.basic = diffConfig(this.formOriginal, this.form)
      if (to.path === '/preference/advanced') {
        next()
      } else {
        if (isEmpty(changedConfig.basic) && isEmpty(changedConfig.advanced)) {
          next()
        } else {
          dialog.showMessageBox({
            type: 'warning',
            title: this.$t('preferences.not-saved'),
            message: this.$t('preferences.not-saved-confirm'),
            buttons: [this.$t('app.yes'), this.$t('app.no')],
            cancelId: 1
          }).then(({ response }) => {
            if (response === 0) {
              if (changedConfig.basic.theme !== undefined) {
                this.$electron.ipcRenderer.send('command',
                                                'application:change-theme', backupConfig.theme)
              }
              if (changedConfig.basic.locale !== undefined) {
                this.handleLocaleChange(this.formOriginal.locale)
              }
              changedConfig.basic = {}
              changedConfig.advanced = {}
              backupConfig.theme = undefined
              next()
            }
          })
        }
      }
    }
  }
</script>
