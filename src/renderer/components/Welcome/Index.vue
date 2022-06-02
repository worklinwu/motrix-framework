<template>
  <el-container>
    <el-main>
      Hello world!
      <el-button @click="handleShowAboutPage">打开 about 窗体</el-button>
    </el-main>
  </el-container>
</template>

<script>
  import logger from 'electron-log'
  import { commands } from '@/components/CommandManager/instance'

  export default {
    name: 'mo-welcome',
    components: {
    },
    props: {
    },
    computed: {
    },
    watch: {
    },
    methods: {
      handleWelcomeDemo () {
        logger.info('hello world!')
      },
      handleShowAboutPage () {
        this.$electron.ipcRenderer.send('command', 'application:show-page', 'about')
      }
    },
    created () {
    },
    mounted () {
      commands.on('welcome-demo', this.handleWelcomeDemo)
    },
    destroyed () {
      commands.off('welcome-demo', this.handleWelcomeDemo)
    }
  }
</script>
