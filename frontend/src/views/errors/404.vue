<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <h1 class="text-9xl font-bold text-primary-600">404</h1>
      <h2 class="mt-4 text-3xl font-bold text-gray-900">Page not found</h2>
      <p class="mt-2 text-gray-600">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div class="mt-6">
        <RouterLink to="/" class="btn btn-primary">
          Go back home
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
