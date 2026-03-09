<script setup>
const { esVisible, editarTotalSelecionados } = defineProps({
    esVisible: Boolean,
    editarTotalSelecionados: Number
})

const emit = defineEmits([
    "eliminarTodos",
    "cambiarSelectedATodos",
    "aplicarFakerFiller",
    "exportarJSON",
]);

</script>

<template>
    <div v-if="esVisible" class="grid grid-cols-2 gap-2 my-2">
        <button @click="emit('eliminarTodos')" class="btn btn-outline-red col-span-2">
            Eliminar todos
        </button>
        <button @click="emit('cambiarSelectedATodos', true)" class="btn btn-outline-primary">
            Seleccionar todos
        </button>
        <button @click="emit('cambiarSelectedATodos', false)" class="btn btn-outline-primary">
            Deseleccionar todos
        </button>
        <button @click="emit('aplicarFakerFiller')" class="btn btn-outline-primary">
            Aplicar Faker Filler ({{ editarTotalSelecionados }})
        </button>
        <button @click="emit('exportarJSON')" class="btn btn-outline-primary">
            Exportar a JSON ({{ editarTotalSelecionados }})
        </button>
    </div>
    <div v-else>
        <span>No hay elementos</span>
    </div>
</template>