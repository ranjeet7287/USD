import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadSection = ({ onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            uploadFile(files[0]);
        } else {
            alert('Please upload a PDF file.');
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const uploadFile = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                // Simulate a small delay for effect
                setTimeout(() => {
                    onUploadComplete(data.filename);
                }, 1000);
            } else {
                console.error('Upload failed');
                setIsUploading(false);
                alert('Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setIsUploading(false);
            alert('Error uploading file. Is the backend running?');
        }
    };

    return (
        <div className="upload-container glass-panel">
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Upload Your Book</h2>

            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf"
                    style={{ display: 'none' }}
                />

                <div className="icon-wrapper">
                    {isUploading ? (
                        <Loader2 className="animate-spin" size={48} color="#60a5fa" />
                    ) : (
                        <Upload size={48} color="#60a5fa" />
                    )}
                </div>

                <div className="text-content">
                    {isUploading ? (
                        <h3>Analyzing Book...</h3>
                    ) : (
                        <>
                            <h3>Click to upload or drag and drop</h3>
                            <p>PDF files only (max 50MB)</p>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        .upload-container {
          padding: 3rem;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .drop-zone {
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 4rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(30, 41, 59, 0.3);
        }
        
        .drop-zone:hover, .drop-zone.dragging {
          border-color: var(--accent-color);
          background: rgba(59, 130, 246, 0.1);
        }
        
        .icon-wrapper {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }
        
        .text-content h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
      `}</style>
        </div>
    );
};

export default UploadSection;
