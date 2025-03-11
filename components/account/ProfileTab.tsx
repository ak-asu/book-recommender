import { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Avatar,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { User } from "firebase/auth";

import { useAuth } from "../../hooks/useAuth";

interface ProfileTabProps {
  user: User;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { updateUserProfile } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setError("Display name cannot be empty");

      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);

      await updateUserProfile(displayName, photoURL);
      setSuccessMessage("Profile updated successfully");
    } catch (err: any) {
      setError(
        `Failed to update profile: ${err.message || "Please try again"}`,
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className="mt-6">
        <CardBody className="gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar
                showFallback
                className="w-24 h-24"
                fallback={
                  <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500">
                      {displayName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                }
                size="lg"
                src={photoURL || "/images/default-avatar.png"}
              />
              <Button
                color="secondary"
                size="sm"
                variant="flat"
                onPress={onOpen}
              >
                Change Avatar
              </Button>
            </div>

            <div className="flex-grow space-y-4">
              <Input
                label="Display Name"
                type="text"
                value={displayName}
                variant="bordered"
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <Input
                isReadOnly
                description="Email cannot be changed"
                label="Email"
                type="email"
                value={user.email || ""}
                variant="bordered"
              />

              {error && <div className="text-danger text-small">{error}</div>}

              {successMessage && (
                <div className="text-success text-small">{successMessage}</div>
              )}

              <Button
                color="primary"
                isLoading={isUpdating}
                onPress={handleUpdateProfile}
              >
                Update Profile
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Avatar URL Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Update Profile Picture</ModalHeader>
          <ModalBody>
            <Input
              description="Enter the URL of your profile picture"
              label="Image URL"
              placeholder="https://example.com/your-image.jpg"
              value={photoURL || ""}
              variant="bordered"
              onChange={(e) => setPhotoURL(e.target.value)}
            />

            {photoURL && (
              <div className="mt-4 flex justify-center">
                <Avatar
                  showFallback
                  className="w-20 h-20"
                  fallback={
                    <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {displayName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  }
                  src={photoURL}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => {
                onClose();
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileTab;
