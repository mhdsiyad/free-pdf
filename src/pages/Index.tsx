
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileImage, FileText, Scissors, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const tools = [
    {
      title: "Image to PDF",
      description: "Convert JPG, PNG, and other images to PDF format with unlimited pages",
      icon: FileImage,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      path: "/image-to-pdf"
    },
    {
      title: "Merge PDF",
      description: "Combine multiple PDF files into one document with no size limit",
      icon: FileText,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      path: "/merge-pdf"
    },
    {
      title: "Split PDF",
      description: "Extract pages or split PDF into separate files for easy management",
      icon: Scissors,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      path: "/split-pdf"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PDF Generator</h1>
            </div>
            <p className="text-sm text-gray-600 hidden sm:block">Free • No limits • No registration</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Free PDF Tools for Everyone
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert images to PDF, merge multiple PDFs, and split documents - all for free with no size limits or registration required.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Link to={tool.path} key={index} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer border-2 hover:border-blue-200">
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-16 h-16 ${tool.color} ${tool.hoverColor} rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:scale-110 transform duration-300`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 mb-6">
                      {tool.description}
                    </CardDescription>
                    <Button className="w-full group-hover:bg-blue-600 transition-colors" size="lg">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Our PDF Tools?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">100% Free</h4>
              <p className="text-gray-600 text-sm">No hidden fees, no subscription required. Use all features completely free.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">No Size Limits</h4>
              <p className="text-gray-600 text-sm">Process files of any size. No restrictions on file dimensions or quantity.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
              <p className="text-gray-600 text-sm">All processing happens in your browser. Your files never leave your device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 PDF Generator. All rights reserved. Built with ❤️ for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
