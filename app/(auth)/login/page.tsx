"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/react";

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center pb-0">
          <h1 className="text-2xl font-bold">Log In</h1>
        </CardHeader>
        <CardBody>
          <LoginForm
            redirectPath="/"
            onSwitchToRegister={() => router.push("/register")}
            onSwitchToReset={() => router.push("/reset-password")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
