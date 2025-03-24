import { useState } from "react";
import { Card, CardHeader, Button, Tabs, Tab } from "@heroui/react";
import { User } from "firebase/auth";

import ProfileTab from "./ProfileTab";
import PreferencesTab from "./PreferencesTab";
import BookmarksTab from "./BookmarksTab";
import FavoritesTab from "./FavoritesTab";

import { useAuth } from "@/hooks/useAuth";

interface AccountTabsProps {
  user: User;
}

const AccountTabs: React.FC<AccountTabsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Account</h1>
          <Button
            color="danger"
            isLoading={isLoading}
            variant="light"
            onPress={handleSignOut}
          >
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
          <ProfileTab user={user} />
        </Tab>
        <Tab key="preferences" title="Preferences">
          <PreferencesTab userId={user.uid} />
        </Tab>
        <Tab key="bookmarks" title="Bookmarks">
          <BookmarksTab userId={user.uid} />
        </Tab>
        <Tab key="favorites" title="Favorites">
          <FavoritesTab userId={user.uid} />
        </Tab>
      </Tabs>
    </>
  );
};

export default AccountTabs;
