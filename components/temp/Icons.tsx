import React from "react";

interface IconProps {
  size?: number;
  width?: number;
  height?: number;
  filled?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const BookmarkIcon = ({
  size = 24,
  width,
  height,
  filled = false,
  strokeWidth = 1.5,
  ...props
}: IconProps) => {
  const hw = width || size;
  const hh = height || size;

  return (
    <svg
      fill="none"
      height={hh}
      viewBox="0 0 24 24"
      width={hw}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <path
          d="M6 21V5C6 3.89543 6.89543 3 8 3H16C17.1046 3 18 3.89543 18 5V21L12 18L6 21Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M6 21V5C6 3.89543 6.89543 3 8 3H16C17.1046 3 18 3.89543 18 5V21L12 18L6 21Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      )}
    </svg>
  );
};

export const HeartIcon = ({
  size = 24,
  width,
  height,
  filled = false,
  strokeWidth = 1.5,
  ...props
}: IconProps) => {
  const hw = width || size;
  const hh = height || size;

  return (
    <svg
      fill="none"
      height={hh}
      viewBox="0 0 24 24"
      width={hw}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      )}
    </svg>
  );
};

export const ShareIcon = ({
  size = 24,
  width,
  height,
  strokeWidth = 1.5,
  ...props
}: IconProps) => {
  const hw = width || size;
  const hh = height || size;

  return (
    <svg
      fill="none"
      height={hh}
      viewBox="0 0 24 24"
      width={hw}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37069L9.08261 8.84128C8.54305 8.32295 7.8089 8 7 8C5.34315 8 4 9.34315 4 11C4 12.6569 5.34315 14 7 14C7.8089 14 8.54305 13.677 9.08261 13.1587L15.0227 16.6293C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.1911 14 16.457 14.323 15.9174 14.8413L9.97733 11.3707C9.9923 11.2492 10 11.1255 10 11C10 10.8745 9.9923 10.7508 9.97733 10.6293L15.9174 7.15872C16.457 7.67705 17.1911 8 18 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export const ChevronDownIcon = ({
  size = 24,
  width,
  height,
  strokeWidth = 1.5,
  ...props
}: IconProps) => {
  const hw = width || size;
  const hh = height || size;

  return (
    <svg
      fill="none"
      height={hh}
      viewBox="0 0 24 24"
      width={hw}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export const BackIcon = ({
  size = 24,
  width,
  height,
  strokeWidth = 1.5,
  ...props
}: IconProps) => {
  const hw = width || size;
  const hh = height || size;

  return (
    <svg
      fill="none"
      height={hh}
      viewBox="0 0 24 24"
      width={hw}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M12 19L5 12L12 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};
