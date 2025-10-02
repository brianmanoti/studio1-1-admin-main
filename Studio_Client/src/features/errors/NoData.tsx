import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface NoDataProps {
  title?: string;
  description?: string;
  svgPath?: string; // Example: "/assets/no-data.svg"
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const NoData: React.FC<NoDataProps> = ({
  title = "No Data Available",
  description = "There's currently nothing to show. Please check back later or add new data.",
  svgPath = "/No-data_ig65.svg",
  actionLabel,
  actionHref,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[80vh] text-center px-4 bg-white rounded-xl">
      {/* SVG Illustration */}
      <div className="w-64 h-64 mb-6">
        <img
          src={svgPath}
          alt="No data illustration"
          className="w-full h-full object-contain opacity-90"
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-500 text-sm md:text-base max-w-md mb-6">
        {description}
      </p>

      {/* CTA Button (Optional) */}
      {actionLabel && (
        <>
          {actionHref ? (
            <Link to={actionHref} className="no-underline">
              <Button className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onAction}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default NoData;