import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Input, Link as NextUILink, Checkbox } from "@heroui/react";

import { useAuth } from "../../hooks/useAuth";

interface RegisterFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  redirectPath = "/",
  onSuccess,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!displayName.trim()) {
      setError("Please enter your name");

      return false;
    }

    if (!email.trim()) {
      setError("Please enter your email");

      return false;
    }

    if (!password) {
      setError("Please enter a password");

      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");

      return false;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match");

      return false;
    }

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions");

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      await signUp(email, password, displayName);

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect after successful registration
        router.push(redirectPath);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(`Registration failed: ${err.message || "Please try again"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        isRequired
        label="Full Name"
        placeholder="Enter your name"
        value={displayName}
        variant="bordered"
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <Input
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
        autoComplete="new-password"
        label="Password"
        placeholder="Create a password"
        type="password"
        value={password}
        variant="bordered"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Input
        isRequired
        autoComplete="new-password"
        label="Confirm Password"
        placeholder="Confirm your password"
        type="password"
        value={passwordConfirm}
        variant="bordered"
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />

      <Checkbox
        isSelected={agreeToTerms}
        size="sm"
        onValueChange={setAgreeToTerms}
      >
        <span className="text-small">
          I agree to the{" "}
          <NextUILink
            className="text-primary"
            href="/terms"
            size="sm"
            underline="hover"
          >
            Terms of Service
          </NextUILink>{" "}
          and{" "}
          <NextUILink
            className="text-primary"
            href="/privacy"
            size="sm"
            underline="hover"
          >
            Privacy Policy
          </NextUILink>
        </span>
      </Checkbox>

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
          Create Account
        </Button>

        <div className="text-center mt-2">
          <span className="text-default-500 text-small">
            Already have an account?{" "}
            <NextUILink
              className="text-primary cursor-pointer text-small"
              underline="hover"
              onClick={onSwitchToLogin}
            >
              Sign In
            </NextUILink>
          </span>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;
