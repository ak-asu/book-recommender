import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Avatar,
  Tabs,
  Tab,
  Spinner,
  Chip,
} from "@heroui/react";

import { useAuth } from "../../hooks/useAuth";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../../services/userService";
import BookList from "../../components/book/BookList";
import { getUserBookmarks, getUserFavorites } from "../../services/userService";
import Container from "../../components/ui/Container";

const AccountPage = () => {
  const { user, isAuthenticated, isLoading, updateUserProfile, signOut } =
    useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");

      // Load user preferences
      const loadUserPreferences = async () => {
        try {
          const prefs = await getUserPreferences(user.uid);

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
        }
      };

      loadUserPreferences();
    }
  }, [user]);

  // Load user's books when the tabs change
  useEffect(() => {
    if (!user) return;

    const loadUserBooks = async () => {
      if (activeTab === "bookmarks" || activeTab === "favorites") {
        setLoadingItems(true);
        try {
          if (activeTab === "bookmarks") {
            const data = await getUserBookmarks(user.uid);

            setBookmarks(data);
          } else {
            const data = await getUserFavorites(user.uid);

            setFavorites(data);
          }
        } catch (err) {
          console.error(`Error loading ${activeTab}:`, err);
        } finally {
          setLoadingItems(false);
        }
      }
    };

    loadUserBooks();
  }, [activeTab, user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);
      await updateUserProfile(displayName, photoURL);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);
      await updateUserPreferences(user.uid, preferences);
    } catch (err) {
      console.error("Error updating preferences:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Container className="flex justify-center items-center min-h-[60vh]">
        <Spinner label="Loading account..." size="lg" />
      </Container>
    );
  }

  // Safety check to ensure user is authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Container className="py-8">
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Account</h1>
          <Button color="danger" variant="light" onPress={handleSignOut}>
            Sign Out
          </Button>
        </CardHeader>
      </Card>

      <Tabs
        aria-label="Account sections"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="profile" title="Profile">
          <Card className="mt-6">
            <CardBody className="gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar
                    className="w-24 h-24"
                    size="lg"
                    src={photoURL || "/images/default-avatar.png"}
                  />
                  <Input
                    className="max-w-xs"
                    label="Avatar URL"
                    size="sm"
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                  />
                </div>

                <div className="flex-grow space-y-4">
                  <Input
                    label="Display Name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />

                  <Input
                    isReadOnly
                    label="Email"
                    type="email"
                    value={user.email || ""}
                  />

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
        </Tab>

        <Tab key="preferences" title="Preferences">
          {preferences ? (
            <Card className="mt-6">
              <CardBody className="gap-6">
                <h2 className="text-xl font-semibold">Reading Preferences</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">
                      Favorite Genres
                    </h3>
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

                            if (!updated.favoriteGenres)
                              updated.favoriteGenres = [];

                            if (updated.favoriteGenres.includes(genre)) {
                              updated.favoriteGenres =
                                updated.favoriteGenres.filter(
                                  (g) => g !== genre,
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
                          preferences.readingGoals?.booksPerMonth?.toString() ||
                          "2"
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
                          preferences.readingGoals?.pagesPerDay?.toString() ||
                          "20"
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
                    <h3 className="text-md font-medium mb-2">
                      Content Preferences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {["short", "medium", "long"].map((length) => (
                        <Chip
                          key={length}
                          className="cursor-pointer"
                          color={
                            preferences.contentPreferences?.preferredLength ===
                            length
                              ? "primary"
                              : "default"
                          }
                          variant={
                            preferences.contentPreferences?.preferredLength ===
                            length
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
                          {length.charAt(0).toUpperCase() + length.slice(1)}{" "}
                          Books
                        </Chip>
                      ))}
                    </div>
                  </div>

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
          ) : (
            <div className="flex justify-center pt-10">
              <Spinner size="lg" />
            </div>
          )}
        </Tab>

        <Tab key="bookmarks" title="Bookmarks">
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Your Bookmarked Books</h2>
            {loadingItems ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : bookmarks.length > 0 ? (
              <BookList books={bookmarks} />
            ) : (
              <Card>
                <CardBody className="py-8 text-center">
                  <p className="text-default-500">
                    You haven&apos;t bookmarked any books yet.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab key="favorites" title="Favorites">
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Your Favorite Books</h2>
            {loadingItems ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : favorites.length > 0 ? (
              <BookList books={favorites} />
            ) : (
              <Card>
                <CardBody className="py-8 text-center">
                  <p className="text-default-500">
                    You haven&apos;t added any books to favorites yet.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AccountPage;
