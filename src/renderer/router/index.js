import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main',
      component: require('@/components/Main').default,
      children: [
        {
          path: '/welcome',
          alias: '/',
          component: require('@/components/Welcome/Index').default,
          props: {
            status: 'active'
          }
        },
        {
          path: '/preference',
          name: 'preference',
          component: require('@/components/Preference/Index').default,
          props: true,
          children: [
            {
              path: 'basic',
              alias: '',
              components: {
                subnav: require('@/components/Subnav/PreferenceSubnav').default,
                form: require('@/components/Preference/Basic').default
              },
              props: {
                subnav: { current: 'basic' }
              }
            },
            {
              path: 'advanced',
              components: {
                subnav: require('@/components/Subnav/PreferenceSubnav').default,
                form: require('@/components/Preference/Advanced').default
              },
              props: {
                subnav: { current: 'advanced' }
              }
            }
          ]
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
