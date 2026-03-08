<script setup>
import { ref, defineEmits } from "vue"
import SeccionEscaneo from "./SeccionEscaneo.vue";
import SeccionModoResultados from "./SeccionModoResultados.vue";

const sectionVisible = ref("resultados");
const emit = defineEmits(["perfilNuevoCreado"]);
</script>

<!-- panel configuración v2.5  -->
<template>
<div class="space-y-4 text-xs max-w-[520px] mx-auto animate-slide-in">
  <SeccionEscaneo 
    v-model:sectionVisible="sectionVisible"
    v-if="sectionVisible === 'escaneo'" 
  />

  <SeccionModoResultados 
    v-model:sectionVisible="sectionVisible"
    v-if="sectionVisible === 'resultados'"
  />
</div>
</template>

