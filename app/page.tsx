"use client";

import React from "react";

import Navbar from "@/components/ui/Navbar";
import SearchBar from "@/components/ui/SearchBar";
import BookList from "@/components/book/BookList";
import SortDropdown from "@/components/ui/SortDropdown";
import HistoryActions from "@/components/ui/HistoryActions";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-booktrack-dark">
      <Navbar />

      <div className="flex-grow">
        <div className="container mx-auto px-4">
          <div className="py-8 flex flex-col items-center relative">
            <div className="w-full max-w-2xl flex justify-end mb-4">
              <HistoryActions />
            </div>

            <div className="w-full max-w-2xl relative">
              <SearchBar />
            </div>

            <div className="w-full max-w-2xl flex justify-end mt-4">
              <SortDropdown />
            </div>
          </div>

          <BookList />
        </div>
      </div>

      <footer className="bg-booktrack-darkgray py-6 border-t border-booktrack-lightgray">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} BookTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
