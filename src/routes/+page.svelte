<script lang="ts">
    import { defineRevealOptions, reveal } from '$lib/index.js';
    import NumberFlow from '@number-flow/svelte';
    import { blur, fade, fly, slide } from 'svelte/transition';
    import Reveal from '$lib/Reveal.svelte';

    // generate some demo cards
    interface Card {
        id: number;
        title: string;
        body: string;
    }
    const cards: Card[] = Array(20)
        .fill(0)
        .map((_, i) => ({
            id: i + 1,
            title: `Card #${i + 1}`,
            body:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
                'Praesent vitae eros eget tellus tristique bibendum. ',
        }));

    // For third part component that needs to be remounted
    let value = $state(123);
    const setValue = () => {
        console.log('Setting value');
        value = 123;
    };
    const resetValue = () => {
        console.log('Resetting value');
        value = 0;
    };
</script>

<div class="page">
    <h1>Scroll-Into-View Animations</h1>

    <!-- grid of cards that slide up/in and slide down/out -->
    <div class="cards">
        {#each cards as card (card.id)}
            <div
                class="card"
                use:reveal={{
                    in: {
                        animation: fly,
                        params: { y: 100, duration: 300 },
                        threshold: 1,
                    },
                    out: {
                        animation: fly,
                        params: { y: -100, duration: 300 },
                        threshold: 1,
                    },
                    once: false,
                    class: 'visible',
                    callbacks: {
                        enter: () => console.log('Entered!'),
                        exit: () => console.log('Exited!'),
                    },
                }}>
                <h2>{card.title}</h2>
                <p>{card.body}</p>
            </div>
        {/each}
    </div>

    <!-- a single element that only fades in once -->
    <div
        class="fade-only"
        use:reveal={{
            transition: {
                animation: fade,
                params: { duration: 800 },
                threshold: 0.3,
            },
            once: true,
        }}>
        <h2>This fades in once!</h2>
        <p>
            It will never fade out; once you've scrolled here, it stays visible.
        </p>
    </div>

    <!-- use @number-flow/svelte with `unmount` animation property -->
    <div
        class="toggle-unmount"
        use:reveal={{
            callbacks: {
                enter: setValue,
                exit: resetValue,
            },
            transition: {
                threshold: 0.3,
            },
        }}>
        <h2>Number Flow Demo</h2>
        <NumberFlow {value} duration={1000} />
        <p>The number will unmount when you scroll past it.</p>
    </div>

    <!-- Component Wrapper Demo -->
    <Reveal transition={{ animation: blur, threshold: 0.3 }}>
        <div class="component-demo">
            <h2>Component Wrapper Demo</h2>
            <p>
                This content is hidden in SSR and only revealed on client mount.
            </p>
        </div>
    </Reveal>

    <!-- Delayed Fade Demo -->
    <div class="delay-container">
        {#each Array(3) as _, i}
            <div
                class="delay-demo"
                use:reveal={{
                    in: {
                        animation: fade,
                        params: { duration: 600, delay: i * 500 },
                    },
                    // No out animation, so that it disappears immediately
                }}>
                <h2>Delayed Fade Demo</h2>
                <p>
                    This block will wait 500 ms before fading in when you scroll
                    it into view.
                </p>
            </div>
        {/each}
    </div>

    <!-- Always Sliding Demo -->
    <div
        class="slide-demo"
        use:reveal={{
            in: {
                animation: slide,
                params: { axis: 'x', duration: 600 },
                threshold: 0.2,
            },
            out: {
                animation: slide,
                params: { axis: 'x', duration: 400 },
                threshold: 0.8,
            },
            once: false,
            initial: true,
            class: 'visible',
            callbacks: {
                enter: () => console.log('Slide Demo Enter'),
                exit: () => console.log('Slide Demo Exit'),
            },
        }}>
        <h2>Always Sliding Demo</h2>
        <p>
            This section slides in from the left on load, and will slide out as
            you scroll past it.
        </p>
    </div>
</div>

<style>
    .page {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: system-ui, sans-serif;
    }
    h1 {
        text-align: center;
        margin-bottom: 1.5rem;
    }
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
    }
    .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        padding: 1.5rem;
        transform-origin: top center;
        will-change: transform, opacity;
    }
    .card h2 {
        margin-top: 0;
        font-size: 1.25rem;
    }
    .fade-only {
        margin: 3rem 0;
        text-align: center;
        padding: 2rem;
        background: #f0f8ff;
        border-radius: 8px;
        will-change: opacity;
    }
    .toggle-unmount {
        margin: 3rem 0;
        text-align: center;
        padding: 2rem;
        background: #f5f5dc;
        border-radius: 8px;
        will-change: opacity;
    }
    :global(number-flow-svelte) {
        --number-flow-char-height: 0.85em;
        font-size: 2rem;
        font-weight: 500;
    }
    .slide-demo {
        margin: 4rem 0;
        padding: 2rem;
        background: #ffe4e1;
        border-radius: 8px;
        text-align: center;
        will-change: transform, opacity;
    }

    .delay-container {
        display: flex;
        gap: 1rem;
    }

    .delay-demo {
        padding: 2rem;
        background: #e6e6fa;
        border-radius: 8px;
        text-align: center;
        will-change: opacity;
    }

    .component-demo {
        margin: 3rem 0;
        padding: 2rem;
        background: #dff0d8;
        border-radius: 8px;
        text-align: center;
    }
</style>
