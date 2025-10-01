
import React from 'react';
import Header from './components/Header';
import ImageProcessor from './components/ImageProcessor';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ImageProcessor />
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Создано с помощью Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
