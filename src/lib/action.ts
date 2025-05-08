import type { Action } from "svelte/action";
import type { InViewOptions, Transition } from "./types.js";
import { runTransition } from "./run.js";

export const inview: Action<HTMLElement, InViewOptions<Transition, Transition>> = (node, options) => {
    // pull out whichever config the user supplied
    let inCfg = options.in ?? options.transition;
    let outCfg = options.out ?? options.transition;
    let once = options.once ?? false;

    // derive thresholds & rootMargin
    const thresholdIn = inCfg?.threshold ?? 0;
    const thresholdOut = outCfg?.threshold ?? 0;
    const rootMargin = options.rootMargin ?? "0px";

    // track the currently active state
    let currentState: "in" | "out" | null = null;

    // holds the last cleanup
    let cleanupFrame: () => void = () => {};
    let observer: IntersectionObserver | null = null;

    function createObserver() {
        // Disconnect the observer if it exists
        observer?.disconnect();

        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const ratio = entry.intersectionRatio;
                    let desiredState: "in" | "out" | null = null;

                    if (ratio >= thresholdIn) {
                        desiredState = "in";
                    } else if (ratio <= thresholdOut) {
                        desiredState = "out";
                    } else {
                        // In the in-between zone, don't trigger any change.
                        continue;
                    }

                    // Only trigger if the state has changed
                    if (currentState === desiredState) continue;
                    currentState = desiredState;

                    if (inCfg && desiredState === "in") {
                        cleanupFrame();
                        cleanupFrame = runTransition(node, inCfg, "in");
                        options.callbacks?.enter?.(node);
                        if (options.class) {
                            const classes = Array.isArray(options.class) ? options.class : [options.class];
                            for (const cls of classes) {
                                node.classList.add(cls);
                            }
                        }
                        if (once) observer?.disconnect();
                    } else if (outCfg && desiredState === "out") {
                        cleanupFrame();
                        cleanupFrame = runTransition(node, outCfg, "out");
                        options.callbacks?.exit?.(node);
                        if (options.class) {
                            const classes = Array.isArray(options.class) ? options.class : [options.class];
                            for (const cls of classes) {
                                node.classList.remove(cls);
                            }
                        }
                        // Don't disconnect on the exiting animation
                        // In all likelihood, it will trigger before the intro animation
                    }
                }
            },
            {
                threshold: [thresholdIn, thresholdOut],
                rootMargin,
            },
        );

        // start observing the node
        observer?.observe(node);
    }

    // create the observer
    createObserver();

    return {
        update(newOpts) {
            observer?.disconnect();
            cleanupFrame();

            inCfg = newOpts.in ?? newOpts.transition;
            outCfg = newOpts.out ?? newOpts.transition;
            once = newOpts.once ?? false;

            // stop any running animation
            cleanupFrame();

            // recreate observer with new thresholds/rootMargin
            createObserver();
        },
        destroy() {
            observer?.disconnect();
            cleanupFrame();
        },
    };
};
