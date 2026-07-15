<script setup lang="ts">
// Shown while a lazy page chunk (Docs / Studio) is still downloading, so a
// navigation gives immediate feedback instead of a blank freeze.
import { DitherSpinner } from "@dither-kit"
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <DitherSpinner :size="26" color="blue" />
  </div>
</template>
