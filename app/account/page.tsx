"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import { useAuth } from "../../hooks/useAuth";
import AccountTabs from "../../components/account/AccountTabs";

import Container from "@/components/ui/Container";

export default function AccountPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <Container className="flex justify-center items-center min-h-[60vh]">
        <Spinner label="Loading account..." size="lg" />
      </Container>
    );
  }

  // Safety check to ensure user is authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Container className="py-8">
      <AccountTabs user={user} />
    </Container>
  );
}
