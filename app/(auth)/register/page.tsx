"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/react";

import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

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
        </CardBody>
      </Card>
    </div>
  );
}
