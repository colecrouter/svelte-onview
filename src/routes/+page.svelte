<script lang="ts">
    import { inview } from '$lib/index.js';
    import { fade, fly } from 'svelte/transition';

    // generate some demo cards
    interface Card {
        id: number;
        title: string;
        body: string;
    }
    const cards: Card[] = Array(12)
        .fill(0)
        .map((_, i) => ({
            id: i + 1,
            title: `Card #${i + 1}`,
            body:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
                'Praesent vitae eros eget tellus tristique bibendum.',
        }));
</script>

<div class="page">
    <h1>Scroll-Into-View Animations</h1>

    <!-- grid of cards that slide up/in and slide down/out -->
    <div class="cards">
        {#each cards as card (card.id)}
            <div
                class="card"
                use:inview={{
                    in: {
                        animation: fly,
                        params: { distance: 40, duration: 500 },
                        threshold: 0,
                    },
                    out: {
                        animation: fly,
                        params: { distance: 40, duration: 300 },
                        threshold: 0.9,
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
        use:inview={{
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
</div>

<style>
    .page {
        max-width: 800px;
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
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1.5rem;
    }
    .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 1rem;
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
</style>
