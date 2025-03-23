import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Input, Spinner, Chip } from "@heroui/react";

import {
  getUserPreferences,
  updateUserPreferences,
} from "../../services/userService";

interface PreferencesTabProps {
  userId: string;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({ userId }) => {
  const [preferences, setPreferences] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        setIsLoading(true);
        const prefs = await getUserPreferences(userId);

        setPreferences(
          prefs || {
            favoriteGenres: [],
            favoriteAuthors: [],
            readingGoals: {
              booksPerMonth: 2,
              pagesPerDay: 20,
            },
            contentPreferences: {
              adultContent: false,
              preferredLength: "medium",
            },
          },
        );
      } catch (err) {
        console.error("Error loading preferences:", err);
        setError("Failed to load your preferences. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPreferences();
  }, [userId]);

  const handleUpdatePreferences = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);

      await updateUserPreferences(userId, preferences);
      setSuccessMessage("Preferences updated successfully");
    } catch (err) {
      console.error("Error updating preferences:", err);
      setError("Failed to update preferences. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading your favorites..." size="lg" />
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <Card className="mt-6">
        <CardBody className="py-8 text-center">
          <p className="text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardBody className="gap-6">
        <h2 className="text-xl font-semibold">Reading Preferences</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-2">Favorite Genres</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Fantasy",
                "Mystery",
                "Romance",
                "Science Fiction",
                "Thriller",
                "Horror",
                "Historical Fiction",
                "Non-Fiction",
                "Biography",
              ].map((genre) => (
                <Chip
                  key={genre}
                  className="cursor-pointer"
                  color={
                    (preferences.favoriteGenres || []).includes(genre)
                      ? "primary"
                      : "default"
                  }
                  variant={
                    (preferences.favoriteGenres || []).includes(genre)
                      ? "solid"
                      : "bordered"
                  }
                  onClick={() => {
                    const updated = { ...preferences };

                    if (!updated.favoriteGenres) updated.favoriteGenres = [];

                    if (updated.favoriteGenres.includes(genre)) {
                      updated.favoriteGenres = updated.favoriteGenres.filter(
                        (g: string) => g !== genre,
                      );
                    } else {
                      updated.favoriteGenres.push(genre);
                    }
                    setPreferences(updated);
                  }}
                >
                  {genre}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-2">Reading Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Books per month"
                max="100"
                min="1"
                type="number"
                value={
                  preferences.readingGoals?.booksPerMonth?.toString() || "2"
                }
                onChange={(e) => {
                  const updated = { ...preferences };

                  if (!updated.readingGoals) updated.readingGoals = {};
                  updated.readingGoals.booksPerMonth =
                    parseInt(e.target.value) || 1;
                  setPreferences(updated);
                }}
              />

              <Input
                label="Pages per day"
                max="1000"
                min="1"
                type="number"
                value={
                  preferences.readingGoals?.pagesPerDay?.toString() || "20"
                }
                onChange={(e) => {
                  const updated = { ...preferences };

                  if (!updated.readingGoals) updated.readingGoals = {};
                  updated.readingGoals.pagesPerDay =
                    parseInt(e.target.value) || 1;
                  setPreferences(updated);
                }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium mb-2">Content Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {["short", "medium", "long"].map((length) => (
                <Chip
                  key={length}
                  className="cursor-pointer"
                  color={
                    preferences.contentPreferences?.preferredLength === length
                      ? "primary"
                      : "default"
                  }
                  variant={
                    preferences.contentPreferences?.preferredLength === length
                      ? "solid"
                      : "bordered"
                  }
                  onClick={() => {
                    const updated = { ...preferences };

                    if (!updated.contentPreferences)
                      updated.contentPreferences = {};
                    updated.contentPreferences.preferredLength = length;
                    setPreferences(updated);
                  }}
                >
                  {length.charAt(0).toUpperCase() + length.slice(1)} Books
                </Chip>
              ))}
            </div>
          </div>

          {error && <div className="text-danger text-small">{error}</div>}
          {successMessage && (
            <div className="text-success text-small">{successMessage}</div>
          )}

          <Button
            color="primary"
            isLoading={isUpdating}
            onPress={handleUpdatePreferences}
          >
            Save Preferences
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default PreferencesTab;
