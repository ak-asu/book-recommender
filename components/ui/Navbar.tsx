"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";

import { useAuth } from "@/hooks/useAuth"; // You'll need to create this context
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const { user, signOut } = useAuth(); // Get user and logout function from auth context
  const [isClient, setIsClient] = useState(false);

  // This ensures hydration doesn't cause issues with SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to home or login page as needed
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const userDropdown = (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          as="button"
          className="transition-transform"
          color="primary"
          name={user?.displayName || "User"}
          size="sm"
          src={user?.photoURL || ""}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="User actions">
        <DropdownItem key="profile" textValue="Profile">
          <NextLink className="w-full" href="/account">
            My Account
          </NextLink>
        </DropdownItem>
        <DropdownItem key="bookmarks" textValue="Bookmarks">
          <NextLink className="w-full" href="/bookmarks">
            My Bookmarks
          </NextLink>
        </DropdownItem>
        <DropdownItem
          key="logout"
          color="danger"
          textValue="Logout"
          onClick={handleLogout}
        >
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Book Recommender</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-end ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          {isClient &&
            (user ? (
              userDropdown
            ) : (
              <Button
                as={NextLink}
                color="primary"
                href="/login"
                variant="flat"
              >
                Login
              </Button>
            ))}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        {isClient &&
          (user ? (
            userDropdown
          ) : (
            <Button
              aria-label="Login"
              as={NextLink}
              color="primary"
              href="/login"
              size="sm"
              variant="flat"
            >
              Login
            </Button>
          ))}
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href="#"
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          {isClient && user && (
            <>
              <NavbarMenuItem>
                <Link color="foreground" href="/account" size="lg">
                  My Account
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link color="foreground" href="/bookmarks" size="lg">
                  My Bookmarks
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link color="danger" href="#" size="lg" onClick={handleLogout}>
                  Logout
                </Link>
              </NavbarMenuItem>
            </>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
