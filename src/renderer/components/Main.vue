<template>
  <el-container id="container">
    <mo-aside />
    <router-view />
    <mo-about-panel :visible="aboutPanelVisible" />
    <mo-dragger />
  </el-container>
</template>

<script>
  import { mapState } from 'vuex'
  import AboutPanel from '@/components/About/AboutPanel'
  import Aside from '@/components/Aside/Index'
  import Dragger from '@/components/Dragger/Index'

  export default {
    name: 'mo-main',
    components: {
      [AboutPanel.name]: AboutPanel,
      [Aside.name]: Aside,
      [Dragger.name]: Dragger
    },
    computed: {
      ...mapState('app', {
        aboutPanelVisible: state => state.aboutPanelVisible
      })
    },
    methods: {
    }
  }
</script>
