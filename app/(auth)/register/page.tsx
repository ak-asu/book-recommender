"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
} from "@heroui/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Password validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);

      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);

      return;
    }

    try {
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });

        // Create user document in Firestore
        await createUserDocument(userCredential.user.uid, {
          displayName,
          email,
          createdAt: new Date().toISOString(),
          preferences: {},
          bookmarks: [],
        });

        router.push("/"); // Redirect to home page after successful registration
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      // Create user document in Firestore if it's a new user
      if (result.user) {
        // Check if this is a new user (you can use additionalUserInfo.isNewUser)
        await createUserDocument(result.user.uid, {
          displayName: result.user.displayName || "",
          email: result.user.email || "",
          createdAt: new Date().toISOString(),
          preferences: {},
          bookmarks: [],
        });
      }

      router.push("/");
    } catch (error: any) {
      console.error("Google registration error:", error);
      setError(error.message || "Failed to register with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a user document in Firestore
  const createUserDocument = async (uid: string, userData: any) => {
    try {
      await setDoc(doc(db, "users", uid), userData);
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center pb-0">
          <h1 className="text-2xl font-bold">Create Account</h1>
        </CardHeader>

        <CardBody>
          {error && (
            <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              isRequired
              label="Name"
              placeholder="Enter your name"
              value={displayName}
              variant="bordered"
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <Input
              isRequired
              label="Email"
              placeholder="Enter your email"
              type="email"
              value={email}
              variant="bordered"
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              isRequired
              endContent={
                <button type="button" onClick={toggleVisibility}>
                  {isVisible ? (
                    <EyeOffIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              label="Password"
              placeholder="Create a password"
              type={isVisible ? "text" : "password"}
              value={password}
              variant="bordered"
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              isRequired
              label="Confirm Password"
              placeholder="Confirm your password"
              type={isVisible ? "text" : "password"}
              value={confirmPassword}
              variant="bordered"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              className="w-full"
              color="primary"
              isLoading={isLoading}
              type="submit"
            >
              Sign Up
            </Button>
          </form>

          <Divider className="my-4" />

          <Button
            className="w-full"
            isLoading={isLoading}
            variant="bordered"
            onClick={handleGoogleRegister}
          >
            Continue with Google
          </Button>
        </CardBody>

        <CardFooter className="flex justify-center pt-0">
          <p>
            Already have an account?{" "}
            <Link className="text-primary cursor-pointer" href="/auth/login">
              Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
