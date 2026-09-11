<!--
    The top of every screen: an optional back arrow, the three-spine logo and
    "GD-Library", with the rule underneath. Takes two grid rows (header and
    rule) starting at `row`, so a page gives it rows "auto, auto" at the top.
-->
<stackLayout {row} col={0} rowSpan={2}>
    <gridLayout rows="auto" columns="auto, auto, *" class="header">
        <button
            col={0}
            text="←  Back"
            class="back-btn"
            visibility={back ? 'visible' : 'collapse'}
            on:tap={() => dispatch('back')}
        />
        <stackLayout col={1} orientation="horizontal" class="logo">
            <stackLayout class="bar bar-1" />
            <stackLayout class="bar bar-2" />
            <stackLayout class="bar bar-3" rotate="8" />
        </stackLayout>
        <label col={2} text="GD-Library" class="brand" />
    </gridLayout>
    <stackLayout class="divider" />
</stackLayout>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    /** The first of the two grid rows the header takes. */
    export let row = 0;
    /** Show the back arrow; the page handles `on:back`. */
    export let back = false;

    const dispatch = createEventDispatcher();
</script>

<style>
    .header {
        padding: 20 20 16 20;
    }

    /* A clear, easy-to-hit Back: an outlined round-ended button with an arrow
       and the word, in the app's button shape. */
    .back-btn {
        background-color: white;
        color: #033047;
        font-size: 14;
        font-weight: bold;
        border-width: 2;
        border-color: #033047;
        border-radius: 100;
        height: 36;
        padding: 0 14;
        margin: 0 14 0 0;
        vertical-align: center;
        text-transform: none;
    }

    .back-btn:highlighted {
        background-color: #033047;
        color: white;
    }

    .logo {
        vertical-align: center;
        margin-right: 10;
    }

    .bar {
        width: 5;
        background-color: #201e1d;
        margin-right: 2;
        vertical-align: bottom;
    }

    .bar-1 { height: 22; }
    .bar-2 { height: 17; }
    .bar-3 { height: 19; background-color: #033047; }

    .brand {
        font-size: 15;
        font-weight: bold;
        font-family: Archivo, sans-serif;
        color: #201e1d;
        vertical-align: center;
    }

    .divider {
        height: 2;
        background-color: #201e1d;
        margin: 0 20;
    }
</style>
