import { runTransition } from "./run.js";
import type { SveltersectOptions, Transition } from "./types.js";

export function reveal<T1 extends Transition | undefined, T2 extends Transition | undefined>(
    node: HTMLElement,
    opts: SveltersectOptions<T1, T2>,
) {
    let options = opts;

    // Update-able options
    let inCfg = options.in ?? options.transition;
    let outCfg = options.out ?? options.transition;
    let once = options.once ?? false;

    // Default parameters
    const thresholdIn = inCfg?.threshold ?? 0;
    const thresholdOut = outCfg?.threshold ?? 0;
    const rootMargin = options.rootMargin ?? "0px";

    let observer: IntersectionObserver | null = null;
    let proxyEl: HTMLElement | null = null;

    // Keep track of which state we are in
    // Otherwise, overlapping thresholds will cause undesired behavior
    let currentState: "in" | "out" | null = null;

    // Cleanup function lets us return an element to its "clean" state
    let cleanupFrame: () => void = () => {};

    // Helper to toggle classes
    function toggleClasses(action: "add" | "remove") {
        if (!options.class) return;
        const classes = Array.isArray(options.class) ? options.class : [options.class];
        for (const cls of classes) {
            node.classList[action](cls);
        }
    }

    function sideEffects(state: "in" | "out") {
        // Handle side effects
        options.callbacks?.[state === "in" ? "enter" : "exit"]?.(node);
        toggleClasses(state === "in" ? "add" : "remove");
    }

    // Helper to process the transition
    function doTransition(state: "in" | "out") {
        // Cancel any animation that is currently running
        cleanupFrame();

        const cfg = state === "in" ? inCfg : outCfg;

        // if no animation, always do instant hide/show
        if (!cfg?.animation) {
            cleanupFrame(); // cancel any prior animation

            if (state === "out") {
                const prior = node.style.visibility;
                node.style.visibility = "hidden";
                cleanupFrame = () => {
                    node.style.visibility = prior;
                };
            } else {
                node.style.visibility = "";
                cleanupFrame = () => {};
            }
            return;
        }

        // Perform the transition
        cleanupFrame = runTransition(node, cfg, state);

        // Only disconnect on entering animation, otherwise elements out of view will be disconnected on mount.
        if (state === "in" && once) observer?.disconnect();
    }

    // Add proxy element with our target inside. This is necessary because
    // we can observe that instead, which will cause less issues with transitions using `transform`.
    function addProxy() {
        if (!options.target) {
            proxyEl = document.createElement("div");
            const parent = node.parentElement;
            if (!parent) return;
            // insert wrapper right where `node` was
            const next = node.nextSibling;
            parent.insertBefore(proxyEl, next);
            // move node into wrapper
            proxyEl.appendChild(node);
        }
    }

    // Remove the proxy element and append the original node back to its parent
    function removeProxy() {
        if (proxyEl?.parentNode) {
            // move node back to where the wrapper is
            proxyEl.parentNode.insertBefore(node, proxyEl);
            proxyEl.parentNode.removeChild(proxyEl);
        }
    }

    function createObserver() {
        observer?.disconnect();

        // Reset any previous proxy element
        removeProxy();
        addProxy();

        const targetEl =
            options.target ??
            proxyEl ??
            (() => {
                throw new Error("No target element found");
            })();

        let seenFirst = false;
        observer = new IntersectionObserver(
            (entries) => {
                // IntersectionObserver immediately fires when first created, so we need to ignore that first event
                if (!seenFirst) {
                    seenFirst = true;
                    return;
                }

                for (const entry of entries) {
                    const ratio = entry.intersectionRatio;
                    // const isAboveIn = thresholdIn === 0 ? ratio > 0 : ratio >= thresholdIn;
                    const isAboveIn = thresholdIn === 0 ? ratio > 0 : ratio >= thresholdIn;
                    const isBelowOut = ratio <= thresholdOut;

                    console.log("currentState", currentState);

                    let desiredState: "in" | "out" | null = null;

                    if (currentState === "in") {
                        // only leave "in" when we drop below the exit threshold
                        if (isBelowOut) desiredState = "out";
                    } else if (currentState === "out") {
                        // only go "in" when we exceed the entry threshold
                        if (isAboveIn) desiredState = "in";
                    }

                    if (!desiredState || desiredState === currentState) continue;

                    currentState = desiredState;
                    doTransition(desiredState);
                    sideEffects(desiredState);
                    if (once && desiredState === "in") observer?.disconnect();
                }
            },
            {
                threshold: [thresholdIn, thresholdOut],
                rootMargin,
                root: options.root,
            },
        );

        observer.observe(targetEl);

        // Because this runs in an action (client only), it is not SSR compatible. The block below is meant to take the initial "all is visible" state, and transition it into the correct state, as set by the config.
        requestAnimationFrame(() => {
            const rect = targetEl.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const intersectionTop = Math.max(rect.top, 0);
            const intersectionBottom = Math.min(rect.bottom, viewportHeight);
            const intersectionHeight = Math.max(intersectionBottom - intersectionTop, 0);
            const ratio = rect.height > 0 ? intersectionHeight / rect.height : 0;

            currentState =
                thresholdIn === 0
                    ? ratio > 0
                        ? "in"
                        : "out"
                    : ratio >= thresholdIn
                      ? "in"
                      : ratio <= thresholdOut
                        ? "out"
                        : "out";

            if (options.initial) {
                // Always run the transition on mount
                doTransition(currentState);
                sideEffects(currentState);

                if (currentState === "in") {
                    // Only disconnect if we are in the "in" state
                    if (once) observer?.disconnect();
                } else {
                    // Don't do anything extra if we are in the "out" state
                }
            } else {
                if (currentState === "in") {
                    // If the element is already in view, don't do anything

                    if (once) observer?.disconnect();
                } else if (currentState === "out") {
                    // If the element is out of view, transition it out
                    doTransition(currentState);
                    sideEffects(currentState);

                    // In this case, we don't want to disconnect the observer
                    // This would mean that the user never sees the element
                }
            }
        });
    }

    createObserver();

    return {
        update(newOpts: typeof options) {
            options = newOpts;
            inCfg = newOpts.in ?? newOpts.transition;
            outCfg = newOpts.out ?? newOpts.transition;
            once = newOpts.once ?? false;
            createObserver();
        },
        destroy() {
            observer?.disconnect();
            cleanupFrame();

            // Unmount the proxy element
            removeProxy();
        },
    };
}
