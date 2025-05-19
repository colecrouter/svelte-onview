<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { reveal } from './action.js';
    import type { SveltersectOptions } from './types.js';

    type T1 = $$Generic<Transition | undefined>;
    type T2 = $$Generic<Transition | undefined>;
    type Props = Omit<SveltersectOptions<T1, T2>, 'initial'>;

    // Define the props for the component, since we are using $$props
    type $$Props = Props;

    // "initial" doesn't make sense here, so remove it
    // @ts-ignore removed from type already, but still in $$props
    let opts: Props = { ...$$props, initial: true };

    let node: HTMLElement;
    let handle: ReturnType<typeof reveal>;
    // hide in SSR
    let style = !browser ? 'visibility:hidden' : undefined;

    // keep the action up-to-date if opts change
    $: if (handle) handle.update(opts);

    onMount(() => {
        handle = reveal(node, opts);
        // now we're client-side: unhide
        style = undefined;
    });

    onDestroy(() => {
        handle?.destroy();
    });
</script>

<div bind:this={node} {style}>
    <slot />
</div>
