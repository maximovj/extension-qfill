<script setup>
defineProps({
    elemento: Object,
})

const actualizarValor = (input, event) => {
    if (input.type === "checkbox") input.value = event.target.checked;
    else if (input.type === "number" || input.type === "range")
        input.value = Number(event.target.value);
    else if (input.type === "select-multiple")
        input.value = Array.from(event.target.selectedOptions).map(
        (opt) => opt.value,
        );
    else input.value = event.target.value;
};
</script>


<template>

    <!-- Elemento | Información -->
    <div class="flex justify-between">
        <div class="truncate w-full w-max-1/2 overflow-auto">
            <input type="checkbox" v-model="elemento.selected" class="accent-[var(--primary)]" />
            <div class="font-medium">
                {{ elemento.name || "Sin nombre" }}
            </div>
            <div class="text-[10px] text-[var(--text-secondary)]">
                {{ elemento.type }} • {{ elemento.id || "sin-id" }}
            </div>
            <div class="text-[10px] truncate max-w-[169px] text-[var(--text-secondary)]">
                id. {{ elemento.autofillId.slice(0, 30) }}...
            </div>
        </div>
    </div>

    <!-- Elemento | Editor dinámico -->
    <div>
        <template v-if="elemento.type === 'checkbox'">
            <label class="flex items-center gap-2">
                <input type="checkbox" :checked="elemento.value" @change="actualizarValor(elemento, $event)" />
                Activado
            </label>
        </template>

        <template v-else-if="
            elemento.type === 'select-one' || elemento.type === 'select-multiple'
        ">
            <select :multiple="elemento.type === 'select-multiple'" @change="actualizarValor(elemento, $event)" class="input text-xs">
                <option v-for="opt in elemento.options" :key="opt" :value="opt" :selected="elemento.type === 'select-multiple'
                    ? elemento.value.includes(opt)
                    : elemento.value === opt
                    ">
                    {{ opt }}
                </option>
            </select>
        </template>

        <template v-else>
            <input type="text" :value="elemento.value" @input="actualizarValor(elemento, $event)" class="input text-xs" />
        </template>
    </div>
</template>
