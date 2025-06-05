import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Scissors, Download, ArrowLeft, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const SplitPdf = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<string>('all');
  const [pageRange, setPageRange] = useState<string>('');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const { toast } = useToast();

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
    
    try {
      // Get page count
      const { getDocument } = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setPageCount(0);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const parsePageRange = (range: string, totalPages: number): number[] => {
    if (!range.trim()) return [];
    
    const pages: Set<number> = new Set();
    const parts = range.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          throw new Error(`Invalid range: ${trimmed}`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        const page = parseInt(trimmed);
        if (isNaN(page) || page < 1 || page > totalPages) {
          throw new Error(`Invalid page number: ${trimmed}`);
        }
        pages.add(page);
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const splitPdf = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to split.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await selectedFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      
      let pagesToExtract: number[] = [];
      
      if (splitMode === 'all') {
        pagesToExtract = Array.from({ length: totalPages }, (_, i) => i + 1);
      } else if (splitMode === 'range') {
        try {
          pagesToExtract = parsePageRange(pageRange, totalPages);
          if (pagesToExtract.length === 0) {
            throw new Error('No valid pages specified');
          }
        } catch (error) {
          toast({
            title: "Invalid page range",
            description: error instanceof Error ? error.message : "Please enter a valid page range (e.g., 1-3, 5, 7-9)",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
      } else if (splitMode === 'split-range') {
        const start = parseInt(rangeStart);
        const end = parseInt(rangeEnd);
        
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          toast({
            title: "Invalid range",
            description: "Please enter valid start and end page numbers.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        // Create a single PDF with the range of pages
        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pages-${start}-to-${end}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success!",
          description: `Pages ${start} to ${end} extracted and downloaded.`,
        });
        setIsProcessing(false);
        return;
      }

      // Create individual PDFs for each page (for 'all' and 'range' modes)
      const filePromises = pagesToExtract.map(async (pageNum) => {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
        newPdf.addPage(copiedPage);
        
        const pdfBytes = await newPdf.save();
        return {
          bytes: pdfBytes,
          name: `page-${pageNum}.pdf`
        };
      });

      const pdfFiles = await Promise.all(filePromises);
      
      // Download each file
      pdfFiles.forEach(({ bytes, name }) => {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      
      toast({
        title: "Success!",
        description: `PDF split into ${pdfFiles.length} separate file(s) and downloaded.`,
      });
      
    } catch (error) {
      console.error('Error splitting PDF:', error);
      toast({
        title: "Split failed",
        description: "There was an error splitting your PDF file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-red-600 hover:text-red-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Link>
              <div className="flex items-center space-x-2">
                <Scissors className="h-8 w-8 text-red-600" />
                <h1 className="text-2xl font-bold text-gray-900">Split PDF</h1>
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
              className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
            >
              <Scissors className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {selectedFile ? selectedFile.name : 'Drag and drop PDF file here'}
              </h3>
              <p className="text-gray-500 mb-4">or</p>
              <label className="cursor-pointer">
                <Button asChild className="bg-red-500 hover:bg-red-600">
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
              {selectedFile && pageCount > 0 && (
                <p className="text-sm text-gray-600 mt-4">
                  📄 {pageCount} pages detected
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Split Options */}
        {selectedFile && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Split Options</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={splitMode} onValueChange={setSplitMode}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Split into individual pages (all {pageCount} pages)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="range" id="range" />
                  <Label htmlFor="range">Extract specific pages</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="split-range" id="split-range" />
                  <Label htmlFor="split-range">Split range of pages (as single PDF)</Label>
                </div>
              </RadioGroup>

              {splitMode === 'range' && (
                <div className="mt-4">
                  <Label htmlFor="pageRange">Page Range</Label>
                  <Input
                    id="pageRange"
                    placeholder="e.g., 1-3, 5, 7-9"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter page numbers or ranges separated by commas. Examples: "1-5" (pages 1 to 5), "1,3,5" (pages 1, 3, and 5), "1-3,7-9" (pages 1-3 and 7-9)
                  </p>
                </div>
              )}

              {splitMode === 'split-range' && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rangeStart">Start Page</Label>
                      <Input
                        id="rangeStart"
                        type="number"
                        min="1"
                        max={pageCount}
                        placeholder="1"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rangeEnd">End Page</Label>
                      <Input
                        id="rangeEnd"
                        type="number"
                        min="1"
                        max={pageCount}
                        placeholder={pageCount.toString()}
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Extract a continuous range of pages as a single PDF file (e.g., pages 5 to 15)
                  </p>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button
                  onClick={splitPdf}
                  disabled={
                    isProcessing || 
                    !selectedFile || 
                    (splitMode === 'range' && !pageRange.trim()) ||
                    (splitMode === 'split-range' && (!rangeStart || !rangeEnd))
                  }
                  size="lg"
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isProcessing ? (
                    "Splitting..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Split PDF
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
            <CardTitle>How to split PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <p>Upload a PDF file by dragging and dropping or clicking "Choose PDF File"</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <p>Choose splitting method: individual pages, extract specific pages, or split a range as single PDF</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <p>Click "Split PDF" to generate and download your PDF files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SplitPdf;
