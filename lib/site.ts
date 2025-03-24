export type SiteConfig = typeof siteConfig;

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Chat",
    href: "/chat",
  },
  {
    label: "Books",
    href: "/books",
  },
  {
    label: "About",
    href: "/about",
  },
];

export const siteConfig = {
  name: "Book Recommender",
  description: "A book recommendation AI application",
  navItems: navItems,
  navMenuItems: navItems,
};
