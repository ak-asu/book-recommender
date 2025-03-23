"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@heroui/react";

import AccountTabs from "../../components/account/AccountTabs";

import Container from "@/components/ui/Container";
import { useAuth } from "@/hooks/useAuth";

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

  // const user = {
  //   id: "12345",
  //   name: "John Doe",
  //   email: "johndoe@example.com",
  //   displayName: "John Doe",
  //   phoneNumber: "+1234567890",
  //   photoURL: "https://example.com/johndoe.jpg",
  //   providerId: "firebase",
  //   uid: "12345",
  //   emailVerified: true,
  //   isAnonymous: false,
  //   metadata: {
  //     creationTime: "2023-01-01T00:00:00Z",
  //     lastSignInTime: "2023-01-10T00:00:00Z",
  //   },
  //   providerData: [],
  //   refreshToken: "sample-refresh-token",
  //   tenantId: "sample-tenant-id",
  //   delete: () => Promise.resolve(),
  //   getIdToken: () => Promise.resolve("sample-id-token"),
  //   getIdTokenResult: () =>
  //     Promise.resolve({
  //       token: "sample-id-token-result",
  //       authTime: "2023-01-01T00:00:00Z",
  //       expirationTime: "2023-01-02T00:00:00Z",
  //       issuedAtTime: "2023-01-01T00:00:00Z",
  //       signInProvider: "password",
  //       signInSecondFactor: null,
  //       claims: {},
  //     }),
  //   reload: () => Promise.resolve(),
  //   toJSON: () => ({}),
  //   preferences: {
  //     genres: ["Science Fiction", "Fantasy"],
  //     length: "Short",
  //     mood: "Adventurous",
  //   },
  //   bookmarks: [
  //     {
  //       id: "book1",
  //       title: "Dune",
  //       author: "Frank Herbert",
  //       cover: "https://example.com/dune.jpg",
  //     },
  //     {
  //       id: "book2",
  //       title: "1984",
  //       author: "George Orwell",
  //       cover: "https://example.com/1984.jpg",
  //     },
  //   ],
  // };

  return (
    <Container className="py-8">
      <AccountTabs user={user} />
    </Container>
  );
}
