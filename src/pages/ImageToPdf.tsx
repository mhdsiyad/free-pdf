
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileImage, Download, X, ArrowLeft, Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface PdfSettings {
  orientation: 'portrait' | 'landscape';
  pageSize: 'fit' | 'a4';
  margin: 'none' | 'small' | 'large';
}

const ImageToPdf = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<PdfSettings>({
    orientation: 'portrait',
    pageSize: 'fit',
    margin: 'small'
  });
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

  const getMarginValue = (margin: string): number => {
    switch (margin) {
      case 'none': return 0;
      case 'small': return 20;
      case 'large': return 40;
      default: return 20;
    }
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
      
      // Set up PDF dimensions based on settings
      let format: 'a4' | [number, number] = 'a4';
      let orientation: 'portrait' | 'landscape' = settings.orientation;
      
      if (settings.pageSize === 'fit' && images.length > 0) {
        // Get dimensions from first image to set custom page size
        const firstImage = images[0];
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = firstImage.preview;
        });
        
        // Convert pixels to mm (assuming 96 DPI)
        const mmPerPixel = 0.264583333;
        const pageWidth = img.width * mmPerPixel;
        const pageHeight = img.height * mmPerPixel;
        
        if (settings.orientation === 'landscape') {
          format = [Math.max(pageWidth, pageHeight), Math.min(pageWidth, pageHeight)];
        } else {
          format = [Math.min(pageWidth, pageHeight), Math.max(pageWidth, pageHeight)];
        }
      }
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });
      
      const margin = getMarginValue(settings.margin);
      
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
        
        // Calculate dimensions based on settings
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        
        let { width, height } = img;
        
        if (settings.pageSize === 'a4') {
          // Scale to fit A4 page while maintaining aspect ratio
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio, 1);
          
          width *= ratio;
          height *= ratio;
        } else {
          // For 'fit' mode, use original image proportions within page bounds
          const mmPerPixel = 0.264583333;
          width = Math.min(img.width * mmPerPixel, maxWidth);
          height = Math.min(img.height * mmPerPixel, maxHeight);
        }
        
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

        {/* PDF Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              PDF Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="orientation">Page Orientation</Label>
                <Select value={settings.orientation} onValueChange={(value: 'portrait' | 'landscape') => 
                  setSettings(prev => ({ ...prev, orientation: value }))
                }>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pageSize">Page Size</Label>
                <Select value={settings.pageSize} onValueChange={(value: 'fit' | 'a4') => 
                  setSettings(prev => ({ ...prev, pageSize: value }))
                }>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Select page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit (same as image)</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="margin">Margin</Label>
                <Select value={settings.margin} onValueChange={(value: 'none' | 'small' | 'large') => 
                  setSettings(prev => ({ ...prev, margin: value }))
                }>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Select margin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No margin</SelectItem>
                    <SelectItem value="small">Small margin</SelectItem>
                    <SelectItem value="large">Large margin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <p>Configure PDF settings: choose orientation (Portrait/Landscape), page size (Fit/A4), and margin options</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <p>Review your images in the preview grid. Remove any unwanted images by clicking the X button</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                <p>Click "Convert to PDF" to generate and download your PDF file with the selected settings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageToPdf;
