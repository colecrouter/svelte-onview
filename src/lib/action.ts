import type { Action } from "svelte/action";
import type { InViewOptions, Transition } from "./types.js";
import { runFinalState, runTransition } from "./run.js";

export const inview: Action<HTMLElement, InViewOptions<Transition | undefined, Transition | undefined>> = (
    node,
    options,
) => {
    // Update-able options
    let inCfg = options.in ?? options.transition;
    let outCfg = options.out ?? options.transition;
    let once = options.once ?? false;

    // Default parameters
    const thresholdIn = inCfg?.threshold ?? 0;
    const thresholdOut = outCfg?.threshold ?? 0;
    const rootMargin = options.rootMargin ?? "0px";

    let observer: IntersectionObserver | null = null;

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
        const cfg = state === "in" ? inCfg : outCfg;
        if (!cfg?.animation) return;
        cleanupFrame();
        cleanupFrame = runTransition(node, cfg, state);
        if (state === "in") {
            options.callbacks?.enter?.(node);
            toggleClasses("add");
            if (once) observer?.disconnect();
        } else {
            options.callbacks?.exit?.(node);
            toggleClasses("remove");
        }
    }

    function createObserver() {
        observer?.disconnect();

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

        // Observe the target element
        const targetEl = options.target ?? node;
        observer.observe(targetEl);

        // Set the default state based on the initial visibility
        // Otherwise, the animation will play on page load
        if (!options.initial) {
            const rect = (options.target ?? node).getBoundingClientRect();
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

            if (currentState === "in" && inCfg) {
                options.callbacks?.enter?.(node);
                toggleClasses("add");
                if (once) observer?.disconnect();
            } else if (currentState === "out" && outCfg) {
                // If the element is out of view, set it to its final "out" state
                cleanupFrame();
                if (!outCfg.animation) return;
                cleanupFrame = runFinalState(node, outCfg, "out");

                options.callbacks?.exit?.(node);
                toggleClasses("remove");
            }
        }
    }

    createObserver();

    return {
        update(newOpts) {
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
        },
    };
};
