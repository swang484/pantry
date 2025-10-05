'use client';

import { useState } from 'react';
import Layout from "../components/Layout";
import UploadModal from "../components/UploadModal";

export default function Upload() {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(true);

    const handleUpload = (file: File) => {
        console.log('Uploading file:', file.name);
        // Handle the file upload logic here
    };

    return (
        <Layout>
            <div className="flex-1">
                <UploadModal 
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUpload={handleUpload}
                />
            </div>
        </Layout>
    );
}
