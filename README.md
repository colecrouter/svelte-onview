# svelte-inview

svelte-inview is an ultra-lightweight library that lets you effortlessly animate elements when they come in/out of view.

[View Demo](https://colecrouter.github.io/svelte-inview)

## Installation

```bash
npm i -D svelte-inview
```

## Usage

svelte-inview has three main ways to animate elements when the enter or exit the viewport:

1. **Svelte Transitions**

Use the built-in Svelte transitions. You can use any of the built-in transitions or create your own.

```svelte
<script>
  import { fade } from 'svelte/transition';
  import { inview } from 'svelte-inview';
</script>
<div use:inview={{ transition: { animation: fade, params: { duration: 800 }, threshold: 0.3 } }}>
  This element will fade in when it enters the viewport and fade out when it exits.
</div>
```

svelte-inview will automatically apply the correct transition in each state.

2. **CSS Classes**

Prefer CSS? Simply pass a class (or classes) to tie it into the observer.

```svelte
<div use:inview={{ class: 'fade-in-out', transition: { threshold: 0.5 } }}>
  This element will fade in when it enters the viewport and fade out when it exits.
</div>
<style>
  div {
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }
  .fade-in-out {
    opacity: 1;
  }
</style>
```

—just remember to set the initial state in your CSS.

3. **Custom Callbacks**
You can also pass callback functions, and trigger your own side-effects.

```svelte
<div use:inview={{ callbacks: { enter: () => console.log('enter'), exit: () => console.log('exit') } }}>
  This element will log to the console when it enters and exits the viewport.
</div>
```

Lastly, you can also use separate parameters for entering and exiting transitions:

```svelte
<div use:inview={{ in: { animation: fly, params: { duration: 200 }, threshold: 0.5 } }}>
  This element will fade in when it enters the viewport and fade out when it exits.
</div>
```

For an extensive list of options, check out the [type declarations](src\lib\types.ts).
