export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Book Recommender",
  description: "A book recommendation AI application",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Books",
      href: "/books",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Books",
      href: "/books",
    },
    {
      label: "Favourites",
      href: "/favourites",
    },
  ],
};
