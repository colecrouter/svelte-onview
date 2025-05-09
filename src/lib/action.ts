import { runTransition } from "./run.js";
import type { InViewOptions, Transition } from "./types.js";

export function inview<T1 extends Transition | undefined, T2 extends Transition | undefined>(
    node: HTMLElement,
    options: InViewOptions<T1, T2>,
) {
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

    // Helper to process the transition
    function doTransition(state: "in" | "out") {
        // Cancel any animation that is currently running
        cleanupFrame();

        const cfg = state === "in" ? inCfg : outCfg;
        if (!cfg?.animation) return;

        // Perform the transition
        cleanupFrame = runTransition(node, cfg, state);

        // Handle side effects
        options.callbacks?.[state === "in" ? "enter" : "exit"]?.(node);
        toggleClasses(state === "in" ? "add" : "remove");

        // Only disconnect on entering animation, otherwise elements out of view will be disconnected on mount.
        if (state === "in" && once) observer?.disconnect();
    }

    // Add proxy element with our target inside. This is necessary because
    // we can observe that instead, which will cause less issues with transitions
    // using `transform`.
    function addProxy() {
        if (!options.target) {
            proxyEl = document.createElement("div");
            node.parentElement?.appendChild(proxyEl);
            proxyEl.appendChild(node);
        }
    }

    // Remove the proxy element and append the original node back to its parent
    function removeProxy() {
        if (proxyEl?.parentNode) {
            const element = proxyEl.children[0];
            if (!element) return; // Ensure the child exists before proceeding
            proxyEl.parentNode.removeChild(proxyEl);
            node.parentElement?.appendChild(element);
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

        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const ratio = entry.intersectionRatio;
                    let desiredState: "in" | "out" | null = null;

                    if (thresholdIn === 0 ? ratio > 0 : ratio >= thresholdIn) {
                        desiredState = "in";
                    } else if (ratio <= thresholdOut) {
                        desiredState = "out";
                    } else {
                        continue;
                    }

                    if (currentState === desiredState) continue;
                    currentState = desiredState;

                    if ((desiredState === "in" && inCfg) || (desiredState === "out" && outCfg)) {
                        doTransition(desiredState);
                    }
                }
            },
            {
                threshold: [thresholdIn, thresholdOut],
                rootMargin,
                root: options.root,
            },
        );

        observer.observe(targetEl);

        // Set the default state based on the initial visibility
        // Otherwise, all elements will animate on mount
        if (!options.initial) {
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

                doTransition(currentState);

                if (currentState === "in" && inCfg) {
                    cleanupFrame();
                    if (!inCfg.animation) return;

                    options.callbacks?.enter?.(node);
                    toggleClasses("add");

                    // Only disconnect on entering animation, otherwise elements out of view will be disconnected on mount.
                    if (once) observer?.disconnect();
                } else if (currentState === "out" && outCfg) {
                    cleanupFrame();
                    if (!outCfg.animation) return;

                    // This is the default behavior when `initial: true`, but we want elements out of view to transition out on mount, instead of just flashing.
                    cleanupFrame = runTransition(node, outCfg, "out");

                    options.callbacks?.exit?.(node);
                    toggleClasses("remove");
                }
            });
        }
    }

    createObserver();

    return {
        update(newOpts: typeof options) {
            observer?.disconnect();
            cleanupFrame();

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
