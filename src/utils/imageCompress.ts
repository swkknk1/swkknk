/**
 * Compresses an uploaded image file on the client-side using HTML5 Canvas.
 * Produces a high-quality, lightweight Base64 data URL suitable for immediate saving.
 */
export async function compressImageFile(file: File, maxDimension = 1000, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill subtle neutral background for transparent PNGs
        ctx.fillStyle = '#f8f8f6';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Rotates a Base64 image data URL by specified degrees (-90 for counter-clockwise / 向左旋转, 90 for clockwise / 向右旋转)
 * using HTML5 Canvas, returning the new rotated Base64 image.
 */
export async function rotateBase64Image(dataUrl: string, degrees = -90, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const rads = (degrees * Math.PI) / 180;
      const is90or270 = Math.abs(degrees % 180) === 90;

      if (is90or270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.fillStyle = '#f8f8f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(rotatedDataUrl);
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}
