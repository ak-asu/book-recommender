import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Link,
  Tooltip,
} from "@heroui/react";

interface BookExternalLinksProps {
  bookId: string;
  title: string;
  author: string;
}

const BookExternalLinks: React.FC<BookExternalLinksProps> = ({
  bookId,
  title,
  author,
}) => {
  const encodedSearch = encodeURIComponent(`${title} ${author}`);

  const externalLinks = [
    {
      name: "Amazon",
      icon: "/images/amazon-logo.png", // You'll need to add these icons
      url: `https://www.amazon.com/s?k=${encodedSearch}&i=stripbooks`,
    },
    {
      name: "Barnes & Noble",
      icon: "/images/bn-logo.png",
      url: `https://www.barnesandnoble.com/s/${encodedSearch}`,
    },
    {
      name: "Goodreads",
      icon: "/images/goodreads-logo.png",
      url: `https://www.goodreads.com/search?q=${encodedSearch}`,
    },
    {
      name: "WorldCat (Libraries)",
      icon: "/images/worldcat-logo.png",
      url: `https://www.worldcat.org/search?q=${encodedSearch}`,
    },
    {
      name: "Google Books",
      icon: "/images/google-books-logo.png",
      url: `https://www.google.com/search?tbm=bks&q=${encodedSearch}`,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <h4 className="font-bold text-medium">Where to Find</h4>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {externalLinks.map((link) => (
            <Tooltip key={link.name} content={link.name}>
              <Link
                isExternal
                aria-label={`Find this book on ${link.name}`}
                href={link.url}
              >
                <Button className="min-w-0 h-8 px-3" size="sm" variant="flat">
                  {link.name}
                </Button>
              </Link>
            </Tooltip>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default BookExternalLinks;
