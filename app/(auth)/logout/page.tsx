"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Button, Card, CardBody, CardFooter } from "@heroui/react";

import { auth } from "@/lib/firebase";

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      router.push("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      setError(error.message || "Failed to logout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md">
        <CardBody className="text-center">
          <h1 className="text-2xl font-bold mb-4">Log Out</h1>
          <p className="mb-6">Are you sure you want to log out?</p>

          {error && (
            <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center gap-4">
          <Button variant="bordered" onClick={handleCancel}>
            Cancel
          </Button>

          <Button color="danger" isLoading={isLoading} onClick={handleLogout}>
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
