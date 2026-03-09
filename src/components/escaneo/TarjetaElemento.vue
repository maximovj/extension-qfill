<script setup>
import { ref } from "vue"
import { MESSAGE_TYPES, ACTIONS } from '@/constants.config.js'
import { sendMessage } from '@/helpers.config.js'

const props = defineProps({
    elementos: Object,
});

const animando = ref(null)

const rellenarInput = async (input) => {
    // TODO: Funcionando
    await sendMessage(
        MESSAGE_TYPES.UI_EVENT,
        ACTIONS.FILL_INPUT_BY_ID,
        { data: input });
};

/* Animación al rellenar */
const rellenarInputAnimado = (input) => {
    rellenarInput(input)
    animando.value = input.id || input.name;

    setTimeout(() => {
        animando.value = null
    }, 600);
}

// Actualiza valores editables en tabla
const actualizarValor = (input, event) => {
    if (input.type === 'checkbox') input.value = event.target.checked;
    else if (input.type === 'number' || input.type === 'range') input.value = Number(event.target.value);
    else if (input.type === 'select-multiple') input.value = Array.from(event.target.selectedOptions).map(opt => opt.value);
    else input.value = event.target.value;
};

</script>

<template>

    <div v-for="i in elementos" :key="i.id"
        class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 transition hover:border-[var(--primary)] hover:shadow-sm"
        :class="animando === i.id ? 'ring-2 ring-green-500 animate-pulse' : ''">

        <!-- header -->

        <div class="flex justify-between gap-2">

            <div class="flex-1 min-w-0">

                <div class="font-medium truncate">
                    {{ i.name || 'Sin nombre' }}
                </div>

                <div class="text-[10px] text-[var(--text-secondary)]">
                    {{ i.type }} • {{ i.id || 'sin-id' }}
                </div>

                <div class="text-[10px] truncate text-[var(--text-secondary)]">
                    id. {{ i.autofillId.slice(0, 30) }}...
                </div>

            </div>

            <div class="flex flex-col items-center gap-2">

                <input type="checkbox" v-model="i.selected" class="accent-[var(--primary)]" />

                <button @click="rellenarInputAnimado(i)" class="btn btn-outline-green text-[10px]">
                    Rellenar
                </button>

            </div>

        </div>

        <!-- editor -->

        <div>

            <template v-if="i.type === 'checkbox'">

                <label class="flex items-center gap-2">
                    <input type="checkbox" :checked="i.value" @change="actualizarValor(i, $event)" />
                    Activado
                </label>

            </template>

            <template v-else-if="i.type === 'select-one' || i.type === 'select-multiple'">

                <select :multiple="i.type === 'select-multiple'" @change="actualizarValor(i, $event)"
                    class="input text-xs w-full">

                    <option v-for="opt in i.options" :key="opt" :value="opt" :selected="i.type === 'select-multiple'
                        ? i.value.includes(opt)
                        : i.value === opt">
                        {{ opt }}
                    </option>

                </select>

            </template>

            <template v-else>

                <input type="text" :value="i.value" @input="actualizarValor(i, $event)" class="input text-xs w-full" />

            </template>

        </div>

    </div>
</template>