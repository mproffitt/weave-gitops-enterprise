import * as React from "react";
import { useTheme } from "styled-components";
function PoliciesIcon({ filled }: { filled: boolean }) {
  const theme = useTheme();
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity={filled ? "0" : "100"}>
        <path
          d="M12 4.09L18 6.67V11.23C17.46 17.41 13.16 19.48 12 19.93C10.84 19.48 6.54 17.41 6 11.23V6.67L12 4.09ZM12 3L5 6.02V11.28C5.66 19.13 12 20.99 12 20.99C12 20.99 18.34 19.13 19 11.28V6.02L12 3.01V3Z"
          fill={theme.colors.neutral30}
        />
        <path
          d="M11.98 10.0601C12.51 10.0601 13.01 10.2701 13.38 10.6401C14.15 11.4101 14.15 12.6701 13.38 13.4401C13.01 13.8101 12.51 14.0201 11.98 14.0201C11.45 14.0201 10.95 13.8101 10.58 13.4401C9.81 12.6701 9.81 11.4101 10.58 10.6401C10.95 10.2701 11.45 10.0601 11.98 10.0601ZM11.98 9.06006C11.22 9.06006 10.45 9.35006 9.87 9.93006C8.71 11.0901 8.71 12.9801 9.87 14.1401C10.45 14.7201 11.21 15.0101 11.98 15.0101C12.75 15.0101 13.51 14.7201 14.09 14.1401C15.25 12.9801 15.25 11.0901 14.09 9.93006C13.51 9.35006 12.75 9.06006 11.98 9.06006Z"
          fill={theme.colors.neutral30}
        />
        <path
          d="M14 14.0601L16.71 16.7701"
          stroke={theme.colors.neutral30}
          strokeMiterlimit="10"
        />
      </g>
      <g opacity={filled ? "100" : "0"}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 3L5 6.02V11.28C5.66 19.13 12 20.99 12 20.99C12 20.99 15.1702 20.0599 17.2605 16.7395L16.6464 17.3536L13.7359 14.443C13.2168 14.821 12.6016 15.0101 11.98 15.0101C11.21 15.0101 10.45 14.7201 9.87 14.1401C8.71 12.9801 8.71 11.0901 9.87 9.93006C10.45 9.35006 11.22 9.06006 11.98 9.06006C12.75 9.06006 13.51 9.35006 14.09 9.93006C15.1208 10.9609 15.2356 12.5681 14.4344 13.7273L17.3318 16.6247C18.1634 15.2653 18.812 13.5156 19 11.28V6.02L12 3.01V3ZM11.98 10.0601C12.51 10.0601 13.01 10.2701 13.38 10.6401C14.15 11.4101 14.15 12.6701 13.38 13.4401C13.01 13.8101 12.51 14.0201 11.98 14.0201C11.45 14.0201 10.95 13.8101 10.58 13.4401C9.81 12.6701 9.81 11.4101 10.58 10.6401C10.95 10.2701 11.45 10.0601 11.98 10.0601Z"
          fill={theme.colors.neutral30}
        />
      </g>
    </svg>
  );
}

export default PoliciesIcon;
