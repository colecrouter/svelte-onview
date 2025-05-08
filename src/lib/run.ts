import type { InViewConfig, Transition } from "./types.js";

export function runTransition<T extends Transition>(
    node: HTMLElement,
    cfg: InViewConfig<T>,
    direction: "in" | "out",
): () => void {
    // 1) snapshot the element’s inline style so we can restore it later
    const originalStyle = node.getAttribute("style");

    // 2) call the user’s transition fn
    const {
        delay = 0,
        duration = 300,
        easing = (t: number) => t,
        css,
        tick,
    } = cfg.animation(node, cfg.params, { direction });

    let rafId: number;
    let timeoutId: number;

    function start() {
        const startTime = performance.now();

        // apply the “initial” frame immediately
        const t0 = direction === "in" ? 0 : 1;
        const u0 = 1 - t0;
        if (css) node.style.cssText = css(t0, u0);
        if (tick) tick(t0, u0);

        function step(now: number) {
            const elapsed = now - startTime;
            const raw = Math.min(elapsed / duration, 1);
            const eased = easing(raw);
            // flip for “out”
            const t = direction === "in" ? eased : 1 - eased;
            const u = 1 - t;

            if (css) node.style.cssText = css(t, u);
            if (tick) tick(t, u);

            if (elapsed < duration) {
                rafId = requestAnimationFrame(step);
            }
        }

        rafId = requestAnimationFrame(step);
    }

    if (delay > 0) {
        timeoutId = window.setTimeout(start, delay);
    } else {
        start();
    }

    // cleanup: cancel any pending frames/timeouts & restore original style
    return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
        if (originalStyle != null) {
            node.setAttribute("style", originalStyle);
        } else {
            node.removeAttribute("style");
        }
    };
}
