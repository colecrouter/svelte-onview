import type { TransitionConfig } from "svelte/transition";

export type Transition = (
    node: Element,
    // biome-ignore lint/suspicious/noExplicitAny: Needs to be any in order for passed functions to match the type
    params: any,
    options: { direction: "in" | "out" | "both" },
) => TransitionConfig;

export type InViewConfig<T extends Transition | undefined> = (T extends Transition
    ? {
          animation: T;
          params?: Parameters<T>[1];
      }
    : {
          animation?: never;
          params?: never;
      }) & {
    /** animation to run; required if provided */
    animation?: unknown;

    /** params to be passed to the animation; optional */
    params?: unknown;
    /**
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#thresholds}
     *
     * passed straight to IntersectionObserver;
     * - `0` means any part of the element is visible
     * - `1` means the entire element is visible
     * @example
     * in: 0 // will appear when any part of it is visible
     * in: 1 //  will appear when the entire element is visible
     * out: 0 // will disappear when no part of the element is visible
     * out: 1 // will disappear when the entire element is visible
     */
    threshold?: number;
};

export type InViewOptions<InP extends Transition | undefined, OutP extends Transition | undefined = undefined> = (
    | {
          in?: InP extends Transition ? InViewConfig<InP> : never;
          out?: OutP extends Transition ? InViewConfig<OutP> : InViewConfig<InP>;
          transition?: never;
      }
    | {
          in?: never;
          out?: never;
          transition: InP extends Transition ? InViewConfig<InP> : never;
      }
) & {
    /**
     * whether to run the animation only once or every time the element comes into view
     * @default false
     */
    once?: boolean;

    /** {@link https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#the_intersection_root_and_root_margin} */
    rootMargin?: string;

    /** entering animation, equivalent to `in:<transition>` directive */
    in?: unknown;

    /** exiting animation, equivalent to `out:<transition>` directive */
    out?: unknown;

    /** dual animation, equivalent to `transition:<transition>` directive */
    transition?: unknown;

    /** CSS classes to add/remove when the element enters/exits view  */
    class?: string | string[];

    /** callbacks to run when the element enters/exits view */
    callbacks?: Partial<Record<"enter" | "exit", (node: Element) => void>>;

    /** element for the IntersectionObserver root
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#the_intersection_root_and_root_margin} */
    root?: Element | null;

    /** substitute node for the IntersectionObserver target */
    target?: Element | null;

    /**
     * Always animate the element **on mount**. The default behavior is to only animate it if it is out of view.
     * @default false
     */
    initial?: boolean;
};
