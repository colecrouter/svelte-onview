# sveltersect

sveltersect is an ultra-lightweight library that lets you effortlessly animate elements when they come in/out of view. Use built-in Svelte transitions, CSS classes, or custom callbacks to create stunning effects with minimal effort.

[View Demo](https://colecrouter.github.io/sveltersect)

Other uses:

- Lazy loading images/components/scripts
- Infinite scrolling

## Installation

```bash
npm i -D sveltersect
```

## Usage

sveltersect has three main ways to animate elements:

1. **Svelte Transitions**

Use the built-in Svelte transitions. You can use any of the built-in transitions or create your own.

```svelte
<script>
  import { fade } from 'svelte/transition';
  import { reveal } from 'sveltersect';
</script>
<div use:reveal={{ transition: { animation: fade, threshold: 0.3 } }}>
  This element will fade in when it enters the viewport and fade out when it exits.
</div>
```

sveltersect will automatically apply the correct transition in each state; mount, unmount, enter, and exit.

2. **CSS Classes**

Prefer CSS? Simply pass a class (or classes) to tie it into the observer.

```svelte
<div use:reveal={{ class: 'fade-in-out', transition: { threshold: 0.5 } }}>
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
<div use:reveal={{ callbacks: { 
  enter: () => console.log('enter'),
  exit: () => console.log('exit')
}}}>
  This element will log to the console when it enters and exits the viewport.
</div>
```

Lastly, you can also use separate parameters for entering and exiting transitions:

```svelte
<div use:reveal={{
  in: { animation: fly, params: { y: 100 }, threshold: 0.5 },
  out: { animation: fade, params: { duration: 200 }, threshold: 0.5 }
}}>
  This element will fade in when it enters the viewport and fade out when it exits.
</div>
```

For an extensive list of options, check out the [type declarations](src\lib\types.ts).

### Use with Third-Party Libraries

Third party libraries are tricky; you need to tickle *just* the right spots to get the desired effect. Because of this, there is no one-size-fits-all solution. Here's an exampel using `number-flow`:

```svelte
<script>
  import NumberFlow from '@number-flow/svelte';
  
  let value = $state(123);
  function setValue() {
    value = 123;
  };
  function resetValue() {
    value = 0;
  };
</script>

<div use:reveal={{
    callbacks: {
        enter: setValue,
        exit: resetValue,
    },
    transition: {
        threshold: 0.3,
    },
}}>
  <NumberFlow {value} duration={1000} />
</div>
```

This will create the following effect

- On mount:
  - If in view, nothing will happen
  - If out of view, the number will transition to `0`
- On enter, the number will transition to `123`
- On exit, the number will transition to `0`

You can change the mounting behavior just by changing the initial value. For example, using `let value = $state(0);`, we get the following:

- On mount:
  - If in view, the number will transition to `123`
  - If out of view, the number will transition to `0`

You may need to also set `initial: true`, which will cause `setValue` to be called on mount.

### Manual Typing

To use the generic type for `reveal` options, do the following:

```ts
const config = {
  in: {
    animation: fade,
    params: { duration: 800 },
  },
  out: {
    animation: fly,
    params: { duration: 800, x: 0 },
  },
} satisfies SveltersectOptions<typeof fade, typeof fly>;
```

—or use the helper function to avoid the generic:

```ts
const config2 = defineRevealOptions({
  in: {
    animation: fade,
    params: { duration: 800 },
  },
  out: {
    animation: fly,
    params: { duration: 800, x: 0 },
  },
})
```

### Component Wrapper

Use the `<Reveal>` Svelte component to wrap any content:

```svelte
<script>
  import { fade } from 'svelte/transition';

  const opts = defineRevealOptions({
    transition: { animation: blur, threshold: 0.3 },
    initial: true,
  });
</script>

<Reveal {...opts}>
  <p>Component demo</p>
</Reveal>
```

Advantages:

- Hides content in SSR (no exit animations on mount)
- No layout shifts!
- Supports the same options as the `reveal` action

## Why is Sveltersect Different?

Sveltersect was created amongst many other libraries that do the same thing. My main goal was to create library that is:

- Compatible with Svelte's built-in transitions
- Extensible (actions, components, callbacks, etc.)
- Takes care of the small details (if you've used transitions *or* IntersectionObserver, you know)

That aside, Sveltersect should be capable of doing everything the other libraries can do, and more. If you find a bug or have a feature request, please open an issue.