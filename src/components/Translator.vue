<template>
  <div class="translator" @dragover='dragover' :class="{ dragging }">
    <header>
      <h2>Vue i18n Translator</h2>
      <small>
        <code>$ cd your/vue/project</code><br/>
        <code>$ npx vue-i18n-service export > translations.json</code><br/>
        <code>drop the <b>translations.json</b> file here</code><br/><br/>
        <code>download the <b @click='download'>translations.edited.json</b> file</code><br/>
        <code>$ npx vue-i18n-service import < translations.edited.json</code><br/>
      </small>
    </header>
    <div class="drop-zone" @dragover='dragover' @drop='dropped'>
      <span>Drop translatiosns.json here.</span>
    </div>
    <ul class="files">
      <li>
        <input v-model='fileFilter' class="filter" placeholder="filter files..." />
      </li>
      <li :key='file' v-for="file in files.filter(x => x.match(new RegExp(fileFilter, 'ig')))">
        <a href='#' @click='editingFile=file'>
          <b v-if='file==editingFile'>{{ file }}</b>
          <span v-else>{{ file }}</span>
        </a>
      </li>
    </ul>
    <div class="editor-actions">
      <button @click='output="json"' :class="{selected:output==='json'}">json</button>
      <button @click='output="yaml"' :class="{selected:output==='yaml'}">yaml</button>
    </div>
    <section class="editor">
      <code class="tag" v-if="output==='yaml'">&lt;i18n lang="yaml"&gt;</code>
      <code class="tag" v-else>&lt;i18n&gt;</code>
      <codemirror v-model='editingSource' @blur='compileEditing' :options='{mode: output === "yaml" ? "text/yaml" : "application/json"}'></codemirror>
      <code class="tag">&lt;/i18n&gt;</code>
    </section>
    <section class="actions">
      <button @click='selectedLocale=locale' :key='locale' v-for='locale in parsedLocales' :class="{selected:locale==selectedLocale}" :disabled='locale==selectedLocale'>{{ locale }}</button>
      <button @click='addLocale'>+</button>
      <button class="download" @click='download'>download <b>translations.edited.json</b></button>
    </section>
    <section class="table">
      <table>
        <tr :key='key' v-for='(value, key) in selectedLocaleEditing'>
          <td>
            <label :class="{error: !value.trim()}">{{ key }}</label>
          </td>
          <td>
            <textarea v-model='editingParsed[`${selectedLocale}.${key}`]'></textarea>
            <button class="remove" @click='removeKey(key)'>&times;</button>
          </td>
        </tr>
        <tr>
          <td>
            <input v-model='newKey.key' placeholder='translation key' />
            <small>You can nest translations keys using dots. Eg. `login.welcome`</small>
          </td>
          <td>
            <textarea v-model='newKey.value'></textarea>
            <button @click='addNewKey'>add new translation</button>
          </td>
        </tr>
      </table>
    </section>
  </div>
</template>

<script>
import YAML from 'js-yaml'
import { flatten, unflatten } from 'flat'

const saveData = (function () {
  const a = document.createElement("a")
  document.body.appendChild(a)
  a.style = "display: none"
  return function (data, fileName) {
    const json = JSON.stringify(data, null, 2),
      blob = new Blob([json], {type: "application/json"}),
      url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
  }
}())

export default {
  name: 'Translator',
  data () {
    return {
      output: 'json',
      fileFilter: '',
      selectedLocale: '',
      parsedLocales: [],
      dragging: false,
      newKey: { key: '', value: '' },
      editingSource: '',
      editingParsed: {},
      editingFile: null,
      translationsSource: `
        {
          "src/components/Hello.vue": {
            "en": {
              "hello": "hello"
            },
            "tr": {
              "hello": "merhaba"
            }
          },
          "src/components/World.vue": {
            "en": {
              "world": "world"
            },
            "tr": {
              "world": "dünya"
            }
          },
          "src/components/Login.vue": {
            "en": {
              "title": "Login",
              "email": "Email",
              "password": "Password",
              "login": "Log In",
              "signin": "Sign In",
              "forget_password": "Forget password?",
              "reset_password": "Reset password"
            },
            "tr": {
              "title": "Giriş",
              "email": "E-posta",
              "password": "Parola",
              "login": "Giriş",
              "signin": "Kayıt Ol",
              "forget_password": "Parolanı mı unuttun?",
              "reset_password": "Parolanı sıfırla"
            }
          }
        }
      `,
      translationsParsed: {},
      files: []
    }
  },
  watch: {
    output () {
      this.editingSource = this.compiler(unflatten(this.editingParsed, { overwrite: true }), null, 2)
      this.compileEditing()
      this.rebuildEditor()
    },
    editingFile (_, oldVal) {
      if (oldVal) {
        this.translationsParsed = {
          ...this.translationsParsed,
          [oldVal]: unflatten(this.editingParsed, { overwrite: true })
        }
        this.compile()
      }
      this.rebuildEditor()
    },
    editingParsed: {
      deep: true,
      handler () {
        this.editingSource = this.compiler(unflatten(this.editingParsed, { overwrite: true }), null, 2)
      }
    }
  },
  computed: {
    parser () {
      return this.output === 'yaml' ? YAML.safeLoad : JSON.parse
    },
    compiler () {
      return this.output === 'yaml' ? YAML.safeDump : JSON.stringify
    },
    selectedLocaleEditing () {
      const keys = unflatten(this.editingParsed, { overwrite: true })[this.selectedLocale]
      return keys ? flatten(keys) : {}
    }
  },
  created () {
    this.parse()
    this.editingFile = this.files[0]
    const myjsonID = window.location.hash.replace(/^#/, '').trim()
    if (myjsonID) {
      try {
        const url = `https://api.myjson.com/bins/${myjsonID}`
        fetch(url)
          .then(r => r.json())
          .then(r => this.inputSource(JSON.stringify(r)))
      } catch (e) {
        alert(`cannot parse myjson url: ${url}`)
      }
    }
  },
  methods: {
    addLocale () {
      const locale = prompt('locale code (en, tr, gr, etc., values will be copied from selected language)', '').trim()
      if (!locale || this.parsedLocales.includes(locale)) return;
      this.parsedLocales.push(locale)
      const copy = unflatten(this.editingParsed, { overwrite: true })[this.selectedLocale]
      for (let [file, i18n] of Object.entries(this.translationsParsed)) {
        this.translationsParsed[file] = {
          ...i18n,
          [locale]: i18n[this.selectedLocale]
        }
      }
      this.selectedLocale = locale
      this.rebuildEditor()
      this.compile()
    },
    dragover (e) {
      e.preventDefault()
      this.dragging = true
    },
    dropped (e) {
      e.preventDefault()
      const reader = new FileReader()
      reader.onload = () => {
        this.inputSource(reader.result)
        this.dragging = false
      }
      const source = reader.readAsText(e.dataTransfer.files[0])
    },
    inputSource (input) {
      this.translationsSource = input
      setTimeout(() => {
        this.parse()
        this.editingFile = this.files[0]
      }, 100)
    },
    parse () {
      this.translationsParsed = JSON.parse(this.translationsSource)
      this.files = Object.keys(this.translationsParsed)
      this.parsedLocales = [...new Set([].concat(
        ...Object.values(this.translationsParsed).map(t => Object.keys(t))
      ))]
      this.selectedLocale = this.parsedLocales[0]
    },
    compile () {
      this.translationsSource = JSON.stringify(this.translationsParsed, null, 2)
    },
    rebuildEditor () {
      this.editingSource = this.compiler(this.translationsParsed[this.editingFile], null, 2)
      this.editingParsed = flatten(this.parser(this.editingSource), { overwrite: true })
    },
    compileEditing () {
      this.editingParsed = flatten(this.parser(this.editingSource), {overwrite: true})
      this.translationsParsed[this.editingFile] = unflatten(this.editingParsed, { overwrite: true })
    },
    removeKey (key) {
      const parsed = { ... this.editingParsed }
      if (!confirm(`all translations with ${key} will be deleted! sure?`)) return;
      this.parsedLocales.forEach(l => {
        delete parsed[`${l}.${key}`]
      })
      this.editingParsed = flatten(parsed, {overwrite: true})
    },
    addNewKey () {
      const parsed = { ... this.editingParsed }
      if (!this.newKey.key.trim()) {
        return;
      }
      this.parsedLocales.forEach(l => {
        parsed[`${l}.${this.newKey.key}`] = parsed[`${l}.${this.newKey.key}`] || ''
      })
      parsed[`${this.selectedLocale}.${this.newKey.key}`] = this.newKey.value
      this.editingParsed = flatten(parsed, { overwrite: true })
      this.editingSource = this.compiler(parsed, null, 2)
      this.compileEditing()
      this.rebuildEditor()
      this.newKey = { key: '', value: '' }
    },
    download () {
      this.compile()
      saveData(this.translationsParsed, 'translations.edited.json')
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
a {
  color: #42b983;
}

header {
  border-bottom: 2px solid rgb(179, 209, 165);
}
h2 {
  margin: 5px 20px;
}
h2 + small {
  display: block;
  margin: 5px 20px;
}
.translator {
  display: grid;
  grid-template-areas:
    "header header header"
    "files actions editor-actions"
    "files table editor";
  grid-template-columns: auto 1fr 1fr;
  grid-template-rows: auto auto 1fr;
  height: 100vh;
}
.drop-zone {
  display: none;
}
.translator.dragging .drop-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  font-size: 50px;
  font-weight: bold;
  top: 0;
  left: 0;
  width: calc(100vw - 30px);
  height: calc(100vh - 30px);
  border-radius: 20px;
  margin: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: 5px dashed #fff;
  z-index: 100;
}

header {
  grid-area: header;
}

.actions {
  grid-area: actions;
  display: flex;
  padding: 0 5px;
  border-bottom: 1px solid #ccc;
}

.editor-actions {
  grid-area: editor-actions;
  display: flex;
  padding: 0 5px;
}

.actions button {
  border: 5px solid transparent;
}

.actions button:last-child {
  margin-left: auto;
}

.editor-actions button.selected,
.actions button.selected {
  border: 5px solid rgb(42, 104, 42);
}

.files {
  grid-area: files;
  background-color: #252525;
  overflow-y: auto;
}

.files a {
  color: #7c7c7c;
  text-decoration: none;
  padding: 10px 20px;
  display: block;
}

.files a b {
  color: #fff;
}

.files a:hover {
  background-color: #585858;
}

.filter {
  width: 100%;
  color: #fff;
  outline: none;
}

.editor {
  grid-area: editor;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #ccc;
  overflow-y: auto;
}

code.tag {
  font-family: Menlo, 'Courier New', Courier, monospace;
  font-weight: bold;
  margin: 5px;
  opacity: 0.4;
}

.editor textarea {
  width: 100%;
  height: 100%;
}

.table {
  grid-area: table;
  overflow-y: auto;
}

.table table {
  width: 100%;
}

.table table td:first-child {
  width: 30%;
}

.table table td {
  vertical-align: top;
  text-align: right;
  position: relative;
}

.table table td .remove {
  display: none;
}

.table table td:hover .remove {
  display: block;
}

button.remove {
  position: absolute;
  background-color: red;
  width: 20px;
  height: 20px;
  top: 5px;
  right: 0;
  border-radius: 50%;
  font-size: 18px !important;
  line-height: 20px;
  padding: 0 !important;
  margin: 0;
  cursor: pointer;
  opacity: 0.4;
}

button.remove:hover {
  opacity: 1;
}

.table table td button {
  padding: 3px;
  font-size: 14px;
}

.table table td input {
  width: 100%;
  display: block;
  text-align: right;
  font-family: Menlo, 'Courier New', Courier, monospace;
}

.table table td input::placeholder {
  text-align: right;
}
</style>
