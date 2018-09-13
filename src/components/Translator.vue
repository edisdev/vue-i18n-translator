<template>
  <div class="translator" @dragover='dragover' :class="{ dragging }">
    <header>
      <h2>vue-i18n-translator</h2>
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
    <section class="editor">
      <codemirror v-model='editingSource'></codemirror>
    </section>
    <section class="actions">
      <button @click='selectedLocale=locale' :key='locale' v-for='locale in parsedLocales' :class="{selected:locale==selectedLocale}" :disabled='locale==selectedLocale'>{{ locale }}</button>
      <button class="download" @click='download'>download <b>translations.json</b></button>
    </section>
    <section class="table">
      <table>
        <tr :key='key' v-for='(value, key) in selectedLocaleEditing'>
          <td><label>{{ key }}</label></td><td><textarea v-model='editingParsed[`${selectedLocale}.${key}`]'></textarea>
            <button @click='removeKey(`${selectedLocale}.${key}`)'>remove translation</button>
          </td>
        </tr>
        <tr>
          <td><input v-model='newKey.key' placeholder='message.deep' /></td><td>
            <textarea v-model='newKey.value'></textarea>
            <button @click='addNewKey'>add new translation</button>
          </td>
        </tr>
      </table>
    </section>
  </div>
</template>

<script>
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
          }
        }
      `,
      translationsParsed: {},
      files: []
    }
  },
  watch: {
    editingFile (_, oldVal) {
      if (oldVal) {
        this.translationsParsed = {
          ...this.translationsParsed,
          [oldVal]: unflatten(this.editingParsed)
        }
        this.compile()
      }
      this.editingSource = JSON.stringify(this.translationsParsed[this.editingFile], null, 2)
      this.editingParsed = flatten(JSON.parse(this.editingSource))
    },
    editingParsed: {
      deep: true,
      handler () {
        this.editingSource = JSON.stringify(unflatten(this.editingParsed, { overwrite: true }), null, 2)
      }
    },
    translationsParsed () {
      console.log(this.translationsParsed)
    },
    editingSource () {
      try {
        this.editingParsed = flatten(JSON.parse(this.editingSource))
      } catch (e) {}
    }
  },
  computed: {
    selectedLocaleEditing () {
      const keys = unflatten(this.editingParsed)[this.selectedLocale]
      return keys ? flatten(keys) : {}
    }
  },
  created () {
    this.parse()
    this.editingFile = this.files[0]
  },
  methods: {
    dragover (e) {
      e.preventDefault()
      this.dragging = true
    },
    dropped (e) {
      e.preventDefault()
      const reader = new FileReader()
      reader.onload = () => {
        this.translationsSource = reader.result
        this.parse()
        this.dragging = false
      }
      const source = reader.readAsText(e.dataTransfer.files[0])
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
    removeKey (key) {
      const parsed = { ... this.editingParsed }
      delete parsed[key]
      this.editingParsed = flatten(parsed)
    },
    addNewKey () {
      const parsed = { ... this.editingParsed }
      if (!this.newKey.key.trim()) {
        return;
      }
      this.parsedLocales.forEach(l => {
        parsed[`${l}.${this.newKey.key}`] = ''
      })
      parsed[`${this.selectedLocale}.${this.newKey.key}`] = this.newKey.value
      this.editingParsed = flatten(parsed)
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
    "header header"
    "files actions"
    "files table"
    "files editor";
  grid-template-columns: auto 1fr;
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

.actions button {
  border: 5px solid transparent;
}

.actions button:last-child {
  margin-left: auto;
}

.actions button.selected {
  border: 5px solid rgb(42, 104, 42);
}

.files {
  grid-area: files;
  background-color: #252525;
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
}

.editor textarea {
  width: 100%;
  height: 100%;
}

.table {
  grid-area: table;
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
}

.table table td button {
  padding: 3px;
  font-size: 14px;
}

.table table td input {
  width: 100%;
  display: block;
}
</style>
