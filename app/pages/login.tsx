import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";

import { useAuth } from "../../hooks/useAuth";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const { redirect } = router.query;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");

      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signIn(email, password);

      // Redirect after successful sign-in
      if (typeof redirect === "string") {
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : "An error occurred during sign in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError("Please fill out all fields");

      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");

      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUp(email, password, displayName);

      // Redirect after successful sign-up
      if (typeof redirect === "string") {
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError(
          "Email is already in use. Please use a different email or sign in.",
        );
      } else {
        setError("An error occurred during sign up. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();

      // Redirect after successful sign-in
      if (typeof redirect === "string") {
        router.push(redirect);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");

      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (err) {
      setError(
        "Failed to send password reset email. Please check if the email is correct.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="flex justify-center items-center min-h-[calc(100vh-200px)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-center">Book Recommender</h1>
          <p className="text-default-500 text-center">
            Discover your next favorite read
          </p>
        </CardHeader>

        <CardBody>
          <Tabs
            fullWidth
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => {
              setActiveTab(key as string);
              setError(null);
            }}
          >
            <Tab key="login" title="Sign In">
              {activeTab === "login" && (
                <form className="space-y-4 py-4" onSubmit={handleSignIn}>
                  <Input
                    isRequired
                    autoComplete="email"
                    label="Email"
                    type="email"
                    value={email}
                    variant="bordered"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    isRequired
                    autoComplete="current-password"
                    label="Password"
                    type="password"
                    value={password}
                    variant="bordered"
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {error && (
                    <div className="mt-2">
                      <p className="text-danger text-small">{error}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      color="primary"
                      isLoading={isLoading}
                      type="submit"
                    >
                      Sign In
                    </Button>
                  </div>

                  <div className="text-center">
                    <button
                      className="text-primary text-small"
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}
            </Tab>
            <Tab key="signup" title="Sign Up">
              {activeTab === "signup" && (
                <form className="space-y-4 py-4" onSubmit={handleSignUp}>
                  <Input
                    isRequired
                    autoComplete="name"
                    label="Display Name"
                    type="text"
                    value={displayName}
                    variant="bordered"
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Input
                    isRequired
                    autoComplete="email"
                    label="Email"
                    type="email"
                    value={email}
                    variant="bordered"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    isRequired
                    autoComplete="new-password"
                    label="Password"
                    type="password"
                    value={password}
                    variant="bordered"
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {error && (
                    <div className="mt-2">
                      <p className="text-danger text-small">{error}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      color="primary"
                      isLoading={isLoading}
                      type="submit"
                    >
                      Create Account
                    </Button>
                  </div>
                </form>
              )}
            </Tab>
            <Tab key="forgot" className="hidden" title="Reset Password">
              {activeTab === "forgot" && (
                <div className="space-y-4 py-4">
                  {resetEmailSent ? (
                    <div className="text-center py-6">
                      <p className="text-success mb-4">
                        Password reset email has been sent! Check your inbox.
                      </p>
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => setActiveTab("login")}
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  ) : (
                    <form className="space-y-4" onSubmit={handleResetPassword}>
                      <Input
                        isRequired
                        autoComplete="email"
                        label="Email"
                        type="email"
                        value={email}
                        variant="bordered"
                        onChange={(e) => setEmail(e.target.value)}
                      />

                      {error && (
                        <div className="mt-2">
                          <p className="text-danger text-small">{error}</p>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          className="w-full"
                          color="primary"
                          isLoading={isLoading}
                          type="submit"
                        >
                          Send Reset Email
                        </Button>
                      </div>

                      <div className="text-center">
                        <button
                          className="text-primary text-small"
                          type="button"
                          onClick={() => setActiveTab("login")}
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </Tab>
          </Tabs>
        </CardBody>

        <Divider />

        <CardFooter className="flex flex-col gap-4">
          <Button
            className="w-full"
            color="default"
            isDisabled={isLoading}
            startContent={
              <img
                alt="Google"
                height={18}
                src="/images/google-logo.svg"
                width={18}
              />
            }
            variant="bordered"
            onPress={handleGoogleSignIn}
          >
            Continue with Google
          </Button>

          <p className="text-default-500 text-center text-small">
            By signing in, you agree to our{" "}
            <Link className="text-primary" href="/terms">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="text-primary" href="/privacy">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
};

export default LoginPage;
