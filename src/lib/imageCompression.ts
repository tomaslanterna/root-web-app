/**
 * Utility to compress and resize image files client-side before uploading.
 * Reduces 15MB-30MB camera photos down to ~300KB-800KB for fast, reliable uploads.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  // If not an image or is SVG/GIF, return unchanged
  if (
    !file.type.startsWith("image/") ||
    file.type.includes("svg") ||
    file.type.includes("gif")
  ) {
    return file;
  }

  // If already under 600KB and JPEG/PNG, no heavy resize needed
  if (file.size < 600 * 1024 && (file.type === "image/jpeg" || file.type === "image/jpg")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }

          const newFileName = file.name.replace(/\.[^.]+$/, "") + ".jpeg";
          const compressedFile = new File([blob], newFileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
