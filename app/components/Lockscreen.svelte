<page actionBarHidden={true} class="page">
    <stackLayout class="container">
        <!-- App Title -->
        <label text="GD-Library" class="title" />

        <!-- Buttons -->
        <button text="Login" class="btn login" on:tap={goToLogin} />
    </stackLayout>
</page>

<script lang="ts">
    import { navigate } from '@nativescript-community/svelte-native';
    import Login from './Login.svelte';

    function goToLogin() {
        navigate({
            page: Login
        });
    }
</script>

<style>

    .page {
        background-image: url("~/images/pastelblurlights.jpg");
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
    }
    
    .container {
        vertical-align: center;
        align-items: center;
        padding: 20;

    }

    .title {
        font-size: 65;
        font-weight: bold;
        margin-bottom: 60;
        text-align: center;
        font-family: Milonga-Regular;
        color: #033047;
    }

    .btn {
        width: 150;
        margin: 10;
        padding: 10;
        border-radius: 100;
        font-size: 16;
        font-weight: bold;
    }

    .login {
        background-color: #033047;
        color: white;
    }
</style>