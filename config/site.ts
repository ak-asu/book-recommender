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
      label: "Account",
      href: "/account",
    },
    {
      label: "Login",
      href: "/login",
    },
    {
      label: "Logout",
      href: "/logout",
    },
    {
      label: "Register",
      href: "/register",
    },
    {
      label: "History",
      href: "/history",
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
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Account",
      href: "/account",
    },
    {
      label: "Login",
      href: "/login",
    },
    {
      label: "Register",
      href: "/register",
    },
    {
      label: "History",
      href: "/history",
    },
    {
      label: "Books",
      href: "/books",
    },
    {
      label: "Favourites",
      href: "/favourites",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
