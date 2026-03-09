<script setup>
import TarjetaElemento from "./TarjetaElemento.vue";

defineProps({
    inputsAgrupados: Object,
});

</script>

<template>
    <div v-for="(grupo, formName) in inputsAgrupados" :key="formName"
        class="max-h-87.5 overflow-y-auto space-y-1">

        <div class="text-[10px] uppercase tracking-wide text-(--text-secondary)">
            {{ formName }}
        </div>

        <TarjetaElemento :elementos="grupo"></TarjetaElemento>
    </div>
</template>