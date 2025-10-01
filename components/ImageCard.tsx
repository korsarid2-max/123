import React from 'react';
import type { ProcessedImage } from '../types';
import Spinner from './Spinner';

interface ImageCardProps {
  image: ProcessedImage;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
    
  const handleDownload = () => {
    if (!image.processedSrc) return;
    const link = document.createElement('a');
    link.href = image.processedSrc;
    const nameParts = image.originalFile.name.split('.');
    const extension = nameParts.pop() || 'png';
    const name = nameParts.join('.');
    link.download = `${name}_enhanced.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
      <div className="grid grid-cols-2 gap-px bg-gray-200">
        <div className="relative">
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">До</div>
          <img src={image.originalSrc} alt="Original product" className="w-full h-48 object-cover"/>
        </div>
        <div className="relative bg-gray-100 flex items-center justify-center">
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">После</div>
          {image.status === 'processing' && (
            <div className="flex flex-col items-center text-gray-500">
                <Spinner />
                <span className="mt-2 text-sm">Обработка...</span>
            </div>
          )}
          {image.status === 'done' && image.processedSrc && (
            <img src={image.processedSrc} alt="Enhanced product" className="w-full h-48 object-cover"/>
          )}
          {image.status === 'error' && (
            <div className="p-4 flex items-center justify-center text-center text-red-600">
                <div className="text-sm">
                    <p className="font-bold">Ошибка</p>
                    <p>{image.error}</p>
                </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-3 bg-white flex justify-between items-center mt-auto">
        <div>
            <p className="text-sm text-gray-700 truncate" title={image.originalFile.name}>{image.originalFile.name}</p>
            <p className="text-xs text-gray-500">{Math.round(image.originalFile.size / 1024)} KB</p>
        </div>
        {image.status === 'done' && image.processedSrc && (
            <button
                onClick={handleDownload}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                title="Скачать изображение"
                aria-label="Скачать обработанное изображение"
            >
                <DownloadIcon />
            </button>
        )}
      </div>
    </div>
  );
};

export default ImageCard;