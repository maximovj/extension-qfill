<script setup>
import TarjetaElemento from "./TarjetaElemento.vue";

defineProps({
    inputsAgrupados: Object,
});

</script>

<template>
    <div v-for="(grupo, formName) in inputsAgrupados" :key="formName"
        class="max-h-[350px] overflow-y-auto space-y-1 space-y-3">

        <div class="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            {{ formName }}
        </div>

        <TarjetaElemento :elementos="grupo"></TarjetaElemento>
    </div>
</template>