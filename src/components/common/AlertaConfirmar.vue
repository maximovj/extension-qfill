<template>
    <dialog 
    class="fixed inset-0 w-[320px] h-fit bg-(--surface) border border-(--border) rounded-xl space-y-4 
    items-center justify-center mx-auto my-auto shadow-2xl backdrop:bg-white/5 backdrop:backdrop-blur-sm"
    ref="dialogoRef">
        <section class="flex flex-col h-fit">
            <header class="p-3 bg-(--bg) flex justify-between items-center">
                <span class="text-[14px]">{{ titulo || "TITULO"  }}</span>
                <span @click="fnAccionCerrar" class="cursor-pointer text-[10px] bg-(--surface) border border-(--border) px-2 py-1 rounded-full text-red-300">X</span>
            </header>
            <main class="p-3 flex-1 overflow-auto">
                {{  mensaje || '¿Seguro que puedes ver esto?'  }}
            </main>
            <span class="inline-block border-gray-500 opacity-50 border-[0.025rem] rounded-4xl"></span>
            <footer class="p-3 flex justify-end gap-2">
                <button @click="fnAccionCerrar" class="btn btn-outline-red">Cancelar</button>
                <button @click="fnAccionAceptar" class="btn btn-outline-green">Aceptar</button>
            </footer>
        </section>
    </dialog>
</template>

<script setup>
import { ref, onUnmounted, onMounted } from 'vue';
const props = defineProps({
    titulo: String,
    mensaje: String,
});

const dialogoRef = ref(null);

let resolvePromise = null;

const abrir = () => {
    dialogoRef.value?.showModal();

    return new Promise((resolve) => {
        resolvePromise  = resolve;
    });
}

const cerrar = (value = false) => {
    dialogoRef.value?.close();
    if(resolvePromise) {
        resolvePromise(value);
        resolvePromise = null;
    }
}

const fnAccionAceptar = () => {
    cerrar(true);
}

const fnAccionCerrar = () => {
    cerrar(false);
}

defineExpose({
    abrir,
    cerrar,
})
</script>