"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

import { auth } from "@/lib/firebase";

interface LogoutButtonProps {
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  size?: "sm" | "md" | "lg";
}

export default function LogoutButton({
  variant = "ghost",
  color = "danger",
  size = "md",
}: LogoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button color={color} size={size} variant={variant} onClick={handleOpen}>
        Log Out
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>Log Out</ModalHeader>
          <ModalBody>Are you sure you want to log out?</ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={handleClose}>
              Cancel
            </Button>
            <Button color="danger" isLoading={isLoading} onPress={handleLogout}>
              Log Out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
