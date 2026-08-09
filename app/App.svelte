<Lockscreen />

<script lang="ts">
    import Lockscreen from './components/Lockscreen.svelte';
    import { initFirebase } from "./services/firebase.js";

    initFirebase();
</script>