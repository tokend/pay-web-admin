<template>
  <div class="requests-index">
    <div class="requests-index__list-wrp">
      <request-list/>
    </div>
  </div>
</template>

<script>
  import RequestList from './Requests.List'

  export default {
    components: { RequestList }
  }
</script>

<style scoped>

</style>
