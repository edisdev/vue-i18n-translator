import Vue from 'vue'
import VueCodemirror from 'vue-codemirror'

import App from './App.vue'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/theme/monokai.css'

Vue.use(VueCodemirror, {
  options: { theme: 'monokai', mode: 'application/json', tabSize: 2, lineWrapping: true },
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
