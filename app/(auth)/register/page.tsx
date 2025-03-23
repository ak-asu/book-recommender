"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";

import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/hooks/useAuth";

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
      console.error("Google registration error:", err);
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
            onClick={handleGoogleRegister}
          >
            Continue with Google
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

// Simple Google icon component
const GoogleIcon = () => (
  <svg
    height="18"
    viewBox="0 0 48 48"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      fill="#FFC107"
    />
    <path
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      fill="#FF3D00"
    />
    <path
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      fill="#4CAF50"
    />
    <path
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      fill="#1976D2"
    />
  </svg>
);
