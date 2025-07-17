import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User, BookMarked, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setQuery, setFilters } from "@/store/slices/booksSlice";
import { searchBooks } from "@/store/slices/booksSlice";

const Navbar = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      setIsLoginDialogOpen(false);
      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error("Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // In a real implementation, this would call a signup API
      // For now, we'll simulate success and auto-login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSignupDialogOpen(false);

      // Auto-login after signup
      await login(email, password);
      toast.success("Account created and logged in successfully!");
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out");
  };

  const handleClearChat = () => {
    // Don't clear history if on the history page
    if (location.pathname !== "/history") {
      // Reset search query and results
      dispatch(setQuery(""));
      dispatch(setFilters({}));
      dispatch(searchBooks({ query: "" }));

      // Show success message
      toast.success("Chat cleared successfully!");

      // If not on index page, navigate to it
      if (location.pathname !== "/") {
        navigate("/");
      }
    }
  };

  return (
    <nav className="border-b border-booktrack-lightgray bg-booktrack-dark px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link className="flex items-center" to="/">
          <span className="text-2xl font-bold text-white">
            <span className="text-booktrack-gold">Book</span>Track
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="relative h-10 w-10 rounded-full"
                  variant="ghost"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage alt={user.name} src={user.photoUrl} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-booktrack-darkgray text-white"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-booktrack-lightgray" />
                <Link to="/account">
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/saved">
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                    <BookMarked className="h-4 w-4" />
                    <span>Bookmarks</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/history">
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span>Search History</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2"
                  onClick={handleClearChat}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Chat</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-booktrack-lightgray" />
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              {/* Login Dialog */}
              <Dialog
                open={isLoginDialogOpen}
                onOpenChange={setIsLoginDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="border-booktrack-lightgray text-white hover:bg-booktrack-lightgray/30"
                    variant="outline"
                  >
                    Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-booktrack-darkgray text-white border-booktrack-lightgray">
                  <form onSubmit={handleLogin}>
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Login to BookTrack
                      </DialogTitle>
                      <DialogDescription>
                        Enter your credentials to access your account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right" htmlFor="email">
                          Email
                        </Label>
                        <Input
                          required
                          className="col-span-3 search-input text-white"
                          id="email"
                          placeholder="youremail@example.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right" htmlFor="password">
                          Password
                        </Label>
                        <Input
                          required
                          className="col-span-3 search-input text-white"
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex justify-between items-center">
                      <Button
                        className="text-booktrack-gold hover:text-booktrack-gold/80"
                        type="button"
                        variant="link"
                        onClick={() => {
                          setIsLoginDialogOpen(false);
                          setIsSignupDialogOpen(true);
                        }}
                      >
                        Don't have an account? Sign up
                      </Button>
                      <Button
                        className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80"
                        disabled={isLoading}
                        type="submit"
                      >
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Sign Up Dialog */}
              <Dialog
                open={isSignupDialogOpen}
                onOpenChange={setIsSignupDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80">
                    Sign Up
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-booktrack-darkgray text-white border-booktrack-lightgray">
                  <form onSubmit={handleSignup}>
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Create an Account
                      </DialogTitle>
                      <DialogDescription>
                        Join BookTrack to discover your next favorite book.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right" htmlFor="signup-name">
                          Name
                        </Label>
                        <Input
                          required
                          className="col-span-3 search-input text-white"
                          id="signup-name"
                          placeholder="Your name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right" htmlFor="signup-email">
                          Email
                        </Label>
                        <Input
                          required
                          className="col-span-3 search-input text-white"
                          id="signup-email"
                          placeholder="youremail@example.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right" htmlFor="signup-password">
                          Password
                        </Label>
                        <Input
                          required
                          className="col-span-3 search-input text-white"
                          id="signup-password"
                          minLength={6}
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex justify-between items-center">
                      <Button
                        className="text-booktrack-gold hover:text-booktrack-gold/80"
                        type="button"
                        variant="link"
                        onClick={() => {
                          setIsSignupDialogOpen(false);
                          setIsLoginDialogOpen(true);
                        }}
                      >
                        Already have an account? Log in
                      </Button>
                      <Button
                        className="bg-booktrack-gold text-booktrack-dark hover:bg-booktrack-gold/80"
                        disabled={isLoading}
                        type="submit"
                      >
                        {isLoading ? "Creating Account..." : "Sign Up"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
