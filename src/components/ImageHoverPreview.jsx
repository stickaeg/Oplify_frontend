import { memo } from "react";

const ImageHoverPreview = memo(function ImageHoverPreview({
  src,
  alt,
  onHoverStart,
  onHoverEnd,
}) {
  if (!src) {
    return (
      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
        N/A
      </div>
    );
  }

  return (
    <div
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="relative inline-block  group"
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="
          h-12 w-12 object-cover rounded-lg
          transition-all duration-200
          group-hover:scale-105
          group-hover:shadow-lg
          will-change-transform
        "
      />

      <span
        className="
          pointer-events-none
          absolute inset-0 rounded-lg
          bg-black/0 group-hover:bg-black/10
          transition-colors
        "
      />
    </div>
  );
});

export default ImageHoverPreview;
