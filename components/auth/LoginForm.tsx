import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Input, Link as NextUILink } from "@heroui/react";

import { useAuth } from "../../hooks/useAuth";

interface LoginFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToReset?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  redirectPath = "/",
  onSuccess,
  onSwitchToRegister,
  onSwitchToReset,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter both email and password");

      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await signIn(email, password);

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect after successful login
        router.push(redirectPath);
      }
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password");
      } else {
        setError(`Login failed: ${err.message || "Please try again"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        autoFocus
        isRequired
        autoComplete="email"
        label="Email"
        placeholder="Enter your email"
        type="email"
        value={email}
        variant="bordered"
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        isRequired
        autoComplete="current-password"
        label="Password"
        placeholder="Enter your password"
        type="password"
        value={password}
        variant="bordered"
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="text-right">
        <NextUILink
          className="text-primary cursor-pointer text-small"
          underline="hover"
          onClick={onSwitchToReset}
        >
          Forgot password?
        </NextUILink>
      </div>

      {error && (
        <div className="mt-2">
          <p className="text-danger text-small">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Button
          className="w-full"
          color="primary"
          isLoading={isLoading}
          type="submit"
        >
          Sign In
        </Button>

        <div className="text-center mt-2">
          <span className="text-default-500 text-small">
            Don't have an account?{" "}
            <NextUILink
              className="text-primary cursor-pointer text-small"
              underline="hover"
              onClick={onSwitchToRegister}
            >
              Sign Up
            </NextUILink>
          </span>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
