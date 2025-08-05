import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, User, BookMarked, History, LogOut } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/ui/Navbar";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Label } from "@heroui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const AccountPage = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-booktrack-dark">
        <Navbar />
        <div className="container mx-auto py-16 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Please login to view your account
          </h2>
          <Link to="/">
            <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success("You have been logged out");
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully");
  };

  return (
    <div className="min-h-screen flex flex-col bg-booktrack-dark">
      <Navbar />

      <div className="container mx-auto py-8 px-4">
        <Link
          className="flex items-center text-booktrack-gold mb-6 hover:underline"
          to="/"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-booktrack-darkgray rounded-lg p-6 mb-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage alt={user.name} src={user.photoUrl} />
                  <AvatarFallback className="text-3xl">
                    {user.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-white mb-1">
                  {user.name}
                </h2>
                <p className="text-gray-400 mb-4">{user.email}</p>

                {user.preferences?.readingLevel && (
                  <Badge className="bg-booktrack-gold text-booktrack-dark">
                    {user.preferences.readingLevel}
                  </Badge>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <Link to="/account">
                  <Button
                    className="w-full justify-start text-white hover:bg-booktrack-lightgray"
                    variant="ghost"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Link to="/saved">
                  <Button
                    className="w-full justify-start text-white hover:bg-booktrack-lightgray"
                    variant="ghost"
                  >
                    <BookMarked className="h-5 w-5 mr-2" />
                    Bookmarks
                  </Button>
                </Link>
                <Link to="/history">
                  <Button
                    className="w-full justify-start text-white hover:bg-booktrack-lightgray"
                    variant="ghost"
                  >
                    <History className="h-5 w-5 mr-2" />
                    Search History
                  </Button>
                </Link>
                <Button
                  className="w-full justify-start text-red-400 hover:bg-booktrack-lightgray hover:text-red-400"
                  variant="ghost"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-booktrack-darkgray rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Profile Information
                </h3>
                <Button
                  className="border-booktrack-gold text-booktrack-gold hover:bg-booktrack-gold hover:text-booktrack-dark"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>

              {isEditing ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveChanges();
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        className="search-input text-white mt-1"
                        defaultValue={user.name}
                        id="name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        disabled
                        className="search-input text-white mt-1 bg-opacity-50"
                        defaultValue={user.email}
                        id="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reading-level">Reading Level</Label>
                      <Input
                        className="search-input text-white mt-1"
                        defaultValue={user.preferences?.readingLevel || ""}
                        id="reading-level"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reading-goal">
                        Annual Reading Goal (books)
                      </Label>
                      <Input
                        className="search-input text-white mt-1"
                        defaultValue={user.preferences?.readingGoal || ""}
                        id="reading-goal"
                        type="number"
                      />
                    </div>
                  </div>

                  <Button
                    className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80 mt-4"
                    type="submit"
                  >
                    Save Changes
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Full Name</p>
                      <p className="text-white">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Reading Level</p>
                      <p className="text-white">
                        {user.preferences?.readingLevel || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        Annual Reading Goal
                      </p>
                      <p className="text-white">
                        {user.preferences?.readingGoal || "Not set"} books
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-booktrack-darkgray rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Reading Preferences
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Favorite Genres</p>
                  {user.preferences?.favoriteGenres &&
                  user.preferences.favoriteGenres.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.favoriteGenres.map((genre) => (
                        <Badge
                          key={genre}
                          className="bg-booktrack-lightgray hover:bg-booktrack-lightgray"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No favorite genres set</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Favorite Authors</p>
                  {user.preferences?.favoriteAuthors &&
                  user.preferences.favoriteAuthors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.favoriteAuthors.map((author) => (
                        <Badge
                          key={author}
                          className="bg-booktrack-lightgray hover:bg-booktrack-lightgray"
                        >
                          {author}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No favorite authors set</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-booktrack-darkgray rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Account Settings
              </h3>

              <div className="space-y-4">
                <Button
                  className="w-full justify-center border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  variant="outline"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
