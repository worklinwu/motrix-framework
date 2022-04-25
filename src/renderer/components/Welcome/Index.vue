<template>
  <el-container
    class="main panel"
  >
    Hello world!
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
