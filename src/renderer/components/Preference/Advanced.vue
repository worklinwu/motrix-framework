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
        ref="advancedForm"
        label-position="right"
        size="mini"
        :model="form"
        :rules="rules"
      >
        <el-form-item
          :label="`${$t('preferences.auto-update')}: `"
          :label-width="formLabelWidth"
        >
          <el-col class="form-item-sub" :span="24">
            <el-checkbox v-model="form.autoCheckUpdate">
              {{ $t('preferences.auto-check-update') }}
            </el-checkbox>
            <div
              class="el-form-item__info"
              style="margin-top: 8px;"
              v-if="form.lastCheckUpdateTime !== 0"
            >
              {{
                $t('preferences.last-check-update-time') + ': ' +
                (
                  form.lastCheckUpdateTime !== 0 ?
                    new Date(form.lastCheckUpdateTime).toLocaleString() :
                    new Date().toLocaleString()
                )
              }}
              <span class="action-link" @click.prevent="onCheckUpdateClick">
                {{ $t('app.check-updates-now') }}
              </span>
            </div>
          </el-col>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button
          type="primary"
          @click="submitForm('advancedForm')"
        >
          {{ $t('preferences.save') }}
        </el-button>
        <el-button
          @click="resetForm('advancedForm')"
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
  import { APP_RUN_MODE } from '@shared/constants'
  import {
    backupConfig,
    calcFormLabelWidth,
    changedConfig,
    checkIsNeedRestart,
    diffConfig
  } from '@shared/utils'
  import { getLanguage } from '@shared/locales'
  import { getLocaleManager } from '@/components/Locale'

  const initForm = (config) => {
    const {
      autoCheckUpdate,
      lastCheckUpdateTime
    } = config
    const result = {
      autoCheckUpdate,
      lastCheckUpdateTime
    }
    return result
  }

  export default {
    name: 'mo-preference-advanced',
    components: {
      [SubnavSwitcher.name]: SubnavSwitcher
    },
    data () {
      const { locale } = this.$store.state.preference.config
      const formOriginal = initForm(this.$store.state.preference.config)
      let form = {}
      form = initForm(extend(form, formOriginal, changedConfig.advanced))

      return {
        form,
        formLabelWidth: calcFormLabelWidth(locale),
        formOriginal,
        rules: {}
      }
    },
    computed: {
      isRenderer: () => is.renderer(),
      title () {
        return this.$t('preferences.advanced')
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
      ...mapState('preference', {
        config: state => state.config
      })
    },
    methods: {
      onCheckUpdateClick () {
        this.$electron.ipcRenderer.send('command', 'application:check-for-updates')
        this.$msg.info(this.$t('app.checking-for-updates'))
        this.$store.dispatch('preference/fetchPreference')
          .then((config) => {
            const { lastCheckUpdateTime } = config
            this.form.lastCheckUpdateTime = lastCheckUpdateTime
          })
      },
      syncFormConfig () {
        this.$store.dispatch('preference/fetchPreference')
          .then((config) => {
            this.form = initForm(config)
            this.formOriginal = cloneDeep(this.form)
            if (changedConfig.basic.theme !== undefined) {
              this.$electron.ipcRenderer.send('command',
                                              'application:change-theme', changedConfig.basic.theme)
            }
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
            ...changedConfig.basic
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
        this.syncFormConfig()
      }
    },
    beforeRouteLeave (to, from, next) {
      changedConfig.advanced = diffConfig(this.formOriginal, this.form)
      if (to.path === '/preference/basic') {
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
                const lng = getLanguage(backupConfig.locale)
                getLocaleManager().changeLanguage(lng)
                this.$electron.ipcRenderer.send('command',
                                                'application:change-locale', lng)
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
