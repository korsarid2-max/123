import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import type { ProcessedImage, StyleKey } from '../types';
import { enhanceProductImage } from '../services/geminiService';
import ImageCard from './ImageCard';

const STYLES: { key: StyleKey; label: string }[] = [
  { key: 'default', label: 'По умолчанию' },
  { key: 'minimalism', label: 'Минимализм' },
  { key: 'vibrant', label: 'Яркий' },
  { key: 'premium', label: 'Премиум' },
];

const ImageProcessor: React.FC = () => {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSingleImage = async (imageToProcess: ProcessedImage, style: StyleKey) => {
    try {
      const [meta, base64Data] = imageToProcess.originalSrc.split(',');
      if (!base64Data) {
        throw new Error('Invalid base64 string.');
      }
      const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
      
      const enhancedBase64 = await enhanceProductImage(base64Data, mimeType, style);
      const processedSrc = `data:${mimeType};base64,${enhancedBase64}`;

      setProcessedImages(prev =>
        prev.map(img =>
          img.id === imageToProcess.id
            ? { ...img, processedSrc, status: 'done' }
            : img
        )
      );
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось улучшить изображение.';
      setProcessedImages(prev =>
        prev.map(img =>
          img.id === imageToProcess.id
            ? { ...img, status: 'error', error: errorMessage }
            : img
        )
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const originalSrc = e.target?.result as string;
        const newImage: ProcessedImage = {
          id: `${file.name}-${Date.now()}`,
          originalFile: file,
          originalSrc,
          processedSrc: null,
          status: 'processing',
        };
        
        setProcessedImages(prev => [newImage, ...prev]);
        processSingleImage(newImage, selectedStyle);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = ''; // Allow re-uploading the same file
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };
  
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const downloadableImages = processedImages.filter(img => img.status === 'done' && img.processedSrc);

    if (downloadableImages.length === 0) return;

    const folder = zip.folder("enhanced_images");
    if (!folder) return;

    downloadableImages.forEach(image => {
        const base64Data = image.processedSrc!.split(',')[1];
        const nameParts = image.originalFile.name.split('.');
        const extension = nameParts.pop() || 'png';
        const name = nameParts.join('.');
        const fileName = `${name}_enhanced.${extension}`;
        folder.file(fileName, base64Data, { base64: true });
    });
    
    try {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        const url = URL.createObjectURL(content);
        link.href = url;
        link.download = "product_images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch(err) {
        console.error("Failed to generate zip file", err);
    }
  };

  const downloadableCount = processedImages.filter(img => img.status === 'done').length;

  return (
    <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl mb-8">
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">1. Выберите стиль</h2>
            <div className="flex justify-center flex-wrap gap-3">
                {STYLES.map(style => (
                <button
                    key={style.key}
                    type="button"
                    role="radio"
                    aria-checked={selectedStyle === style.key}
                    onClick={() => setSelectedStyle(style.key)}
                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    selectedStyle === style.key
                        ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                >
                    {style.label}
                </button>
                ))}
            </div>
        </div>
        
        <div className="w-full max-w-2xl mb-4">
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">2. Загрузите фото</h2>
        </div>
        <div 
          className={`w-full max-w-2xl p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500 hover:bg-gray-50'}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          role="button"
          aria-label="Image upload zone"
        >
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-gray-600">Перетащите изображения сюда или <span className="font-semibold text-indigo-600">нажмите для выбора файлов</span></p>
          <p className="text-sm text-gray-500 mt-1">Получите студийное качество для ваших продуктовых фото</p>
        </div>

      {processedImages.length > 0 ? (
        <div className="mt-12 w-full">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Результаты</h2>
                {downloadableCount > 0 && (
                    <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        aria-label={`Скачать все ${downloadableCount} изображений`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Скачать все ({downloadableCount})</span>
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {processedImages.map(image => (
                    <ImageCard key={image.id} image={image} />
                ))}
            </div>
        </div>
      ) : (
        <div className="mt-12 text-center text-gray-500">
          <p>Начните с загрузки фотографий вашего продукта.</p>
        </div>
      )}
    </div>
  );
};

export default ImageProcessor;