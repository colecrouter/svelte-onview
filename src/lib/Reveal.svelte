<script lang="ts">
  import { browser } from "$app/environment";
  import { reveal } from "./action.js";
  import type { SveltersectOptions } from "./types.js";

  type T1 = $$Generic<Transition | undefined>;
  type T2 = $$Generic<Transition | undefined>;
  type Props = Omit<SveltersectOptions<T1, T2>, "initial">;

  // Define the props for the component, since we are using $$props
  type $$Props = Props;

  // "initial" doesn't make sense here, so remove it
  // @ts-ignore removed from type already, but still in $$props
  let opts: Props = { ...$$restProps, initial: true };

  // hide in SSR
  let style = !browser ? "visibility:hidden" : undefined;

  // Define the target element for the reveal action
  // This is defined separately so it is reactive
  export let target: Element | undefined | null = undefined;

  // Update opts when target changes
  $: opts = { ...opts, target };
</script>

<div use:reveal={opts} {style}>
  <slot />
</div>
