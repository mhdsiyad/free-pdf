
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileImage, Download, X, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

const ImageToPdf = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files detected",
        description: "Only image files (JPG, PNG, GIF, etc.) are allowed.",
        variant: "destructive"
      });
    }

    const newImages: ImageFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please add at least one image to convert.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Create a promise to load the image
        const loadImage = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = image.preview;
        });

        const img = await loadImage;
        
        // Calculate dimensions to fit page while maintaining aspect ratio
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        
        let { width, height } = img;
        
        // Scale down if image is larger than page
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);
        
        width *= ratio;
        height *= ratio;
        
        // Center the image on the page
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(img, 'JPEG', x, y, width, height);
      }
      
      // Download the PDF
      pdf.save('converted-images.pdf');
      
      toast({
        title: "Success!",
        description: `PDF created with ${images.length} page(s) and downloaded successfully.`,
      });
      
    } catch (error) {
      console.error('Error converting to PDF:', error);
      toast({
        title: "Conversion failed",
        description: "There was an error converting your images to PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Link>
              <div className="flex items-center space-x-2">
                <FileImage className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Image to PDF</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Upload Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <FileImage className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Drag and drop images here
              </h3>
              <p className="text-gray-500 mb-4">or</p>
              <label className="cursor-pointer">
                <Button asChild>
                  <span>
                    <Plus className="h-4 w-4 mr-2" />
                    Choose Images
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </label>
              <p className="text-sm text-gray-400 mt-4">
                Supports JPG, PNG, GIF and other image formats
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Images ({images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.preview}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Page {index + 1}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={convertToPdf}
                  disabled={isProcessing || images.length === 0}
                  size="lg"
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isProcessing ? (
                    "Converting..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Convert to PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <p>Upload one or more images by dragging and dropping or clicking "Choose Images"</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <p>Review your images in the preview grid. Remove any unwanted images by clicking the X button</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <p>Click "Convert to PDF" to generate and download your PDF file</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageToPdf;
