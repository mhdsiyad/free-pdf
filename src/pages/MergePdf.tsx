
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, X, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface PdfFile {
  file: File;
  id: string;
  name: string;
  size: string;
}

const MergePdf = () => {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf'
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files detected",
        description: "Only PDF files are allowed.",
        variant: "destructive"
      });
    }

    const newPdfFiles: PdfFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: formatFileSize(file.size)
    }));

    setPdfFiles(prev => [...prev, ...newPdfFiles]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    const newFiles = [...pdfFiles];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const mergePdfs = async () => {
    if (pdfFiles.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please add at least 2 PDF files to merge.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Import PDF-lib dynamically
      const { PDFDocument } = await import('pdf-lib');
      
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pageIndices = pdf.getPageIndices();
        
        const pages = await mergedPdf.copyPages(pdf, pageIndices);
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create download link
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: `${pdfFiles.length} PDF files merged successfully and downloaded.`,
      });
      
    } catch (error) {
      console.error('Error merging PDFs:', error);
      toast({
        title: "Merge failed",
        description: "There was an error merging your PDF files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-green-600 hover:text-green-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">Merge PDF</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Upload PDF Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
            >
              <FileText className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Drag and drop PDF files here
              </h3>
              <p className="text-gray-500 mb-4">or</p>
              <label className="cursor-pointer">
                <Button asChild className="bg-green-500 hover:bg-green-600">
                  <span>
                    <Plus className="h-4 w-4 mr-2" />
                    Choose PDF Files
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </label>
              <p className="text-sm text-gray-400 mt-4">
                Select multiple PDF files to merge into one document
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {pdfFiles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>PDF Files ({pdfFiles.length})</CardTitle>
              <p className="text-sm text-gray-600">Files will be merged in the order shown below</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {pdfFiles.map((pdf, index) => (
                  <div key={pdf.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{pdf.name}</p>
                        <p className="text-sm text-gray-500">{pdf.size}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === pdfFiles.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePdf(pdf.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={mergePdfs}
                  disabled={isProcessing || pdfFiles.length < 2}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isProcessing ? (
                    "Merging..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Merge PDF Files
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
            <CardTitle>How to merge PDFs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <p>Upload multiple PDF files by dragging and dropping or clicking "Choose PDF Files"</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <p>Arrange the files in your desired order using the up/down arrows</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <p>Click "Merge PDF Files" to combine all files into one document and download it</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MergePdf;
