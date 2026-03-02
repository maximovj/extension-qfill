<template>
  <div class="border border-[var(--border)] rounded-lg">
    <!-- Header -->
    <div
      @click="openInfo = !openInfo"
      class="cursor-pointer p-2 flex justify-between items-center"
    >
      <span class="font-bold text-secondary"
        >{{ titulo || "Información de recurso" }}
      </span>

      <span
        class="transition-transform duration-300"
        :class="openInfo ? 'rotate-180' : ''"
      >
        ▼
      </span>
    </div>

    <!-- Contenido animado -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="openInfo" class="p-3 border-t border-[var(--border)]">
        <!-- Tu contenido -->
        <section>
          <slot name="contenido"></slot>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, defineProps } from "vue";

defineProps({
  titulo: String,
});

const openInfo = ref(true);
</script>
