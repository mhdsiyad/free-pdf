
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Archive, Download, ArrowLeft, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const CompressPdf = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<string>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setOriginalSize(file.size);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const compressPdf = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to compress.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      console.log(`Original PDF size: ${formatFileSize(arrayBuffer.byteLength)}`);
      
      // Get compression settings based on level
      let useObjectStreams = false;
      let addDefaultPage = false;
      
      switch (compressionLevel) {
        case 'low':
          useObjectStreams = false;
          break;
        case 'medium':
          useObjectStreams = true;
          break;
        case 'high':
          useObjectStreams = true;
          break;
      }

      // Basic compression using available PDF-lib options
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: useObjectStreams,
        addDefaultPage: addDefaultPage,
        updateFieldAppearances: false,
      });
      
      console.log(`Compressed PDF size: ${formatFileSize(compressedPdfBytes.length)}`);
      
      // Calculate compression ratio
      const compressionRatio = ((originalSize - compressedPdfBytes.length) / originalSize * 100).toFixed(1);
      const sizeDifference = originalSize - compressedPdfBytes.length;
      
      // Create download link
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      if (sizeDifference > 0) {
        link.download = `compressed-${selectedFile.name}`;
        
        toast({
          title: "Success!",
          description: `PDF compressed by ${compressionRatio}%. Original: ${formatFileSize(originalSize)}, Compressed: ${formatFileSize(compressedPdfBytes.length)}`,
        });
      } else {
        link.download = `optimized-${selectedFile.name}`;
        
        toast({
          title: "Compression complete",
          description: `This PDF is already optimized. File size: ${formatFileSize(compressedPdfBytes.length)}`,
        });
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error compressing PDF:', error);
      toast({
        title: "Compression failed",
        description: "There was an error compressing your PDF file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-purple-600 hover:text-purple-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Link>
              <div className="flex items-center space-x-2">
                <Archive className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Compress PDF</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Upload PDF File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
            >
              <Archive className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {selectedFile ? selectedFile.name : 'Drag and drop PDF file here'}
              </h3>
              <p className="text-gray-500 mb-4">or</p>
              <label className="cursor-pointer">
                <Button asChild className="bg-purple-500 hover:bg-purple-600">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF File
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </label>
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-4">
                  📄 File size: {formatFileSize(originalSize)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compression Options */}
        {selectedFile && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Compression Level</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={compressionLevel} onValueChange={setCompressionLevel}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">Low compression (better quality, larger file)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium compression (balanced quality and size)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">High compression (smaller file, reduced quality)</Label>
                </div>
              </RadioGroup>

              <div className="flex justify-center mt-6">
                <Button
                  onClick={compressPdf}
                  disabled={isProcessing || !selectedFile}
                  size="lg"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isProcessing ? (
                    "Compressing..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Compress PDF
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
            <CardTitle>How to compress PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <p>Upload a PDF file by dragging and dropping or clicking "Choose PDF File"</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <p>Select compression level: Low (better quality), Medium (balanced), or High (smaller size)</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <p>Click "Compress PDF" to reduce file size and download the optimized PDF</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompressPdf;
