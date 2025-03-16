import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight font-bold text-foreground",
  variants: {
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-4xl lg:text-5xl",
      lg: "text-5xl lg:text-6xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const subtitle = tv({
  base: "text-foreground/80",
  variants: {
    size: {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});
