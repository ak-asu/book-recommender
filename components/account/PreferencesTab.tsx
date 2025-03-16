import React, { useState } from "react";
import { Button, Input, Checkbox } from "@heroui/react";

interface PreferencesTabProps {
  userId: string;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({ userId }) => {
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [favoriteAuthor, setFavoriteAuthor] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenreChange = (genre: string) => {
    setPreferredGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleSavePreferences = async () => {
    try {
      setErrorMessage("");
      // Example: Save data to Firebase
      // await updateUserPreferences({ author: favoriteAuthor, genres: preferredGenres });
      console.log("Preferences saved:", { favoriteAuthor, preferredGenres });
    } catch (error) {
      setErrorMessage("Unable to save preferences. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2 style={{ marginBottom: "1rem" }}>Preferences</h2>
      <Input
        fullWidth
        label="Favorite Author"
        placeholder="Enter your favorite author"
        style={{ marginBottom: "1rem" }}
        value={favoriteAuthor}
        onChange={(e) => setFavoriteAuthor(e.target.value)}
      />
      <div style={{ marginBottom: "1rem" }}>
        <p>Select Preferred Genres:</p>
        {["Fiction", "Mystery", "Sci-Fi", "Fantasy"].map((genre) => (
          <Checkbox
            key={genre}
            checked={preferredGenres.includes(genre)}
            onChange={() => handleGenreChange(genre)}
          >
            {genre}
          </Checkbox>
        ))}
      </div>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <Button onPress={handleSavePreferences}>Save Preferences</Button>
    </div>
  );
};

export default PreferencesTab;
