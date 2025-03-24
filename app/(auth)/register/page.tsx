"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";

import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/hooks/useAuth";
import { GoogleIcon } from "@/components/icons";

export default function RegisterPage() {
  const { signInWithGoogle } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: any) {
      setGoogleError(
        err.message || "Failed to register with Google. Please try again.",
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center pb-0">
          <h1 className="text-2xl font-bold">Create Account</h1>
        </CardHeader>
        <CardBody>
          <RegisterForm
            redirectPath="/"
            onSwitchToLogin={() => router.push("/login")}
          />
          <Divider className="my-4" />
          {googleError && (
            <div className="mb-3">
              <p className="text-danger text-small">{googleError}</p>
            </div>
          )}
          <Button
            className="w-full"
            isLoading={isGoogleLoading}
            startContent={!isGoogleLoading && <GoogleIcon />}
            variant="bordered"
            onPress={handleGoogleRegister}
          >
            Continue with Google
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
