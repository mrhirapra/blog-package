@xai/blog-editor
A TypeScript-based blog editor package for React/Next.js applications with an embedded json-server backend.
Installation
Install the package via npm:
npm install @xai/blog-editor

Setup
1. Start the Backend Server
The package includes a json-server backend to manage blog posts and images. After installing the package, start the server by running:
npx @xai/blog-editor start-server

This will start json-server on http://localhost:3001. Ensure this server is running before using the BlogEditor or BlogList components.
2. Import and Use the Components
BlogEditor
The BlogEditor component allows users to create and save blog posts with rich text and images.
import { BlogEditor } from '@xai/blog-editor';

function App() {
  const config = {
    allowedIPs: ['127.0.0.1'], // Replace with your IP restrictions
    savePath: 'blog-posts', // Not used with json-server
    imagePath: 'blog-images', // Not used with json-server
  };
  const clientIP = '127.0.0.1'; // Replace with the user's IP

  return (
    <div>
      <BlogEditor config={config} clientIP={clientIP} />
    </div>
  );
}

export default App;

BlogList
The BlogList component displays all blog posts and images, with options to remove them.
import { BlogList } from '@xai/blog-editor';

function App() {
  return (
    <div>
      <BlogList />
    </div>
  );
}

export default App;

Features

Create Posts: Use the BlogEditor to write and save blog posts with rich text and images.
Fetch Posts and Images: The BlogList component fetches and displays all saved posts and images.
Remove Posts and Images: Remove individual posts or images using buttons in the BlogList component.
Embedded Backend: Uses json-server to manage data, so no external backend setup is required.

Notes

The backend data is stored in node_modules/@xai/blog-editor/dist/db.json. If you uninstall the package, this data will be lost.
For production, consider replacing json-server with a proper backend (e.g., MongoDB for posts, AWS S3 for images).
