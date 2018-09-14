<template>
  <div id="app">
    <Translator />
  </div>
</template>

<script>
import Translator from './components/Translator.vue'

export default {
  name: 'app',
  components: {
    Translator
  }
}
</script>

<style>
body {
  padding: 0;
  margin: 0;
}
#app {
  font-family: 'Menlo', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  font-size: 16px;
}

.CodeMirror {
  font-family: Menlo, 'Courier New', Courier, monospace !important;
  font-size: 18px !important;
  height: 100% !important;
}

button, input, textarea, label {
  background-color: rgb(113, 143, 99);
  border: 0;
  font-size: 16px;
  border-radius: 0;
  padding: 8px 15px;
  margin: 5px 0;
  color: #fff;
  box-sizing: border-box;
}

input, textarea, label {
  display: block;
  background-color: transparent;
  border-bottom: 1px solid rgb(113, 143, 99);
  border-radius: 0;
  color: #000;
}

label.error {
  color: red;
  font-weight: bold;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  height: 35px;
  line-height: 24px;
  min-height: 35px;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.8);
  outline: none;
}

label {
  border-bottom: 0;
}
</style>
