<template>

  <!-- Global UI Components -->
  <ToastNotification />
  <ConfirmDialog />
  <PresentationOverlay />
  
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component 
        :is="Component" 
        :key="route.meta.layoutKey || route.path"
      />

    </transition>
  </router-view>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import ToastNotification from './components/ui/ToastNotification.vue';
import ConfirmDialog from './components/ui/ConfirmDialog.vue';
import PresentationOverlay from './components/ui/PresentationOverlay.vue';
import { initTheme } from './services/theme';
import { API_BASE_URL } from './apiConfig';

let keepAliveTimer = null;

function pingBackend() {
  fetch(`${API_BASE_URL}/api/ping`).catch(() => {});
}

onMounted(() => {
  initTheme();
  // Keep-alive: ping backend every 5 minutes to prevent free-tier sleep
  pingBackend();
  keepAliveTimer = setInterval(pingBackend, 5 * 60 * 1000);
});

onBeforeUnmount(() => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>