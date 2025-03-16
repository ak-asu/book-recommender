import React from "react";
import { FaStar } from "react-icons/fa";

interface RatingProps {
  readOnly?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | number;
  value: number;
  onChange?: (rating: number) => void;
}

const Rating: React.FC<RatingProps> = ({
  readOnly = false,
  className = "",
  size = 24,
  value,
  onChange,
}) => {
  const MAX_STARS = 5;

  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={className} style={{ display: "flex" }}>
      {[...Array(MAX_STARS)].map((_, index) => {
        const filled = index < value;

        return (
          <FaStar
            key={index}
            color={filled ? "#FFD700" : "#CCC"}
            size={size}
            style={{ cursor: readOnly ? "default" : "pointer" }}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
};

export default Rating;
