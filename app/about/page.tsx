"use client";

import { Card, CardBody, Divider, Link } from "@heroui/react";

import Container from "@/components/ui/Container";
import { title, subtitle } from "@/lib/primitives";

export default function AboutPage() {
  return (
    <Container className="py-8 px-4 md:px-8 mx-auto">
      <div className="text-center mb-10">
        <h1 className={title({ size: "lg" })}>About Our Book Recommender</h1>
        <p className={subtitle({ class: "mt-4" })}>
          Discover your next favorite book with our AI-powered recommendation
          engine
        </p>
      </div>
      <Card className="mb-8 shadow-md">
        <CardBody>
          <h2 className={title({ size: "sm" })}>Our Mission</h2>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            We believe everyone deserves to find books that speak to their
            unique interests and preferences. Our mission is to connect readers
            with books they&apos;ll love using cutting-edge AI technology and a
            personalized approach to recommendations.
          </p>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md">
          <CardBody>
            <h2 className={title({ size: "sm" })}>How It Works</h2>
            <Divider className="my-3" />
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Type natural language queries about the books you&apos;re
                looking for
              </li>
              <li>Our hybrid recommendation engine processes your request</li>
              <li>
                Receive personalized book recommendations based on your
                preferences
              </li>
              <li>Provide feedback to improve future recommendations</li>
              <li>Save your favorites and track your reading history</li>
            </ul>
          </CardBody>
        </Card>
        <Card className="shadow-md">
          <CardBody>
            <h2 className={title({ size: "sm" })}>Our Technology</h2>
            <Divider className="my-3" />
            <p className="text-gray-700 dark:text-gray-300">
              We combine multiple recommendation approaches for the best
              results:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300">
              <li>OpenAI&apos;s natural language processing</li>
              <li>Collaborative filtering based on user preferences</li>
              <li>Content-based filtering analyzing book characteristics</li>
              <li>User feedback integration for continuous improvement</li>
            </ul>
          </CardBody>
        </Card>
      </div>
      <Card className="mb-8 shadow-md">
        <CardBody>
          <h2 className={title({ size: "sm" })}>Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {[
              {
                title: "Personalized Recommendations",
                desc: "Tailored book suggestions based on your tastes",
              },
              {
                title: "Natural Language Search",
                desc: "Find books using conversational language",
              },
              {
                title: "Detailed Book Information",
                desc: "Comprehensive details about each recommendation",
              },
              {
                title: "Reading History",
                desc: "Track books you've discovered and liked",
              },
              { title: "Bookmarking", desc: "Save books for later reference" },
              {
                title: "Where to Read/Buy",
                desc: "Direct links to purchase or borrow books",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800"
              >
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="text-center">
          <h2 className={title({ size: "sm" })}>Get Started</h2>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            Ready to discover your next great read? Head to our home page and
            start exploring our recommendations or search for specific books
            that match your interests.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark"
              href="/"
            >
              Start Exploring
            </Link>
            <Link
              className="bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary-dark"
              href="/signup"
            >
              Create Account
            </Link>
          </div>
        </CardBody>
      </Card>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} Book Recommender. All rights reserved.
        </p>
      </footer>
    </Container>
  );
}
