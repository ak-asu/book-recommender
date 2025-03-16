import React from "react";
import { Alert } from "@heroui/react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = "",
}) => {
  if (!message) return null;

  return (
    <Alert className={`my-4 ${className}`} color="danger" variant="solid">
      {message}
    </Alert>
  );
};

export default ErrorMessage;
