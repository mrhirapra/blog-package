import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { BlogEditorProps, BlogContent } from '../../../shared/types';
import { apiClient } from '../../../shared/api/client';
import { checkIPAccess, validateImageFile, fileToBase64 } from '../../../shared/utils';
import './styles.css';

// Custom image upload handler module
class ImageUploadHandler {
    static register() {
        const BaseImageFormat: any = Quill.import('formats/image');

        class CustomImageFormat extends BaseImageFormat {
            static create(value: string) {
                const node = super.create(value);
                node.setAttribute('data-custom', 'true');
                return node;
            }
        }

        Quill.register(CustomImageFormat, true);
    }
}

const BlogEditor: React.FC<BlogEditorProps> = ({
    config = {},
    clientIP = '',
    onSave,
    onError,
    className = '',
    initialContent,
    onContentChange,
}) => {
    const [title, setTitle] = useState(initialContent?.title || '');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const quillRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<Quill | null>(null);

    // Initialize Quill editor
    useEffect(() => {
        if (!quillRef.current || quillInstance.current) return;

        // Check IP access if IP restrictions are configured
        if (config.allowedIPs && config.allowedIPs?.length > 0 && clientIP) {
            // const hasAccess = checkIPAccess(clientIP, config.allowedIPs);
            // if (!hasAccess) {
            //     setError('Access denied: Your IP is not authorized');
            //     setIsLoading(false);
            //     return;
            // }
        }

        try {
            // Register custom modules
            ImageUploadHandler.register();

            quillInstance.current = new Quill(quillRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['blockquote', 'code-block'],
                        ['link', 'image', 'video'],
                        ['clean'],
                    ],
                    history: {
                        delay: 2000,
                        maxStack: 100,
                        userOnly: true,
                    },
                    clipboard: {
                        matchVisual: false,
                    },
                },
                placeholder: 'Start writing your blog post...',
                formats: ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'link', 'image', 'video'],
            });

            // Set initial content if provided
            if (initialContent?.content) {
                quillInstance.current.clipboard.dangerouslyPasteHTML(initialContent.content);
            }

            // Add content change handler
            quillInstance.current.on('text-change', () => {
                if (onContentChange && quillInstance.current) {
                    onContentChange({
                        title,
                        content: quillInstance.current.root.innerHTML,
                    });
                }
            });

            // Custom image handler
            const toolbar: any = quillInstance.current.getModule('toolbar');
            toolbar.addHandler('image', () => handleImageButtonClick());

            setIsLoading(false);
        } catch (err) {
            handleError(err as Error, 'Failed to initialize editor');
            setIsLoading(false);
        }

        return () => {
            quillInstance.current = null;
        };
    }, [clientIP, config.allowedIPs]);

    const handleImageButtonClick = useCallback(async () => {
        if (!quillInstance.current) return;

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                // Validate image
                const validation = validateImageFile(file, config);
                if (!validation.valid) {
                    throw new Error(validation.error);
                }

                // Convert to base64
                const base64Image = await fileToBase64(file);
                const base64Data = base64Image.split(',')[1];

                // Upload image
                const savedImage = await apiClient.uploadImage(file.name, base64Data);
                const imageUrl = `data:${savedImage.type};base64,${savedImage.base64Data}`;

                // Insert into editor
                const range = quillInstance.current?.getSelection();
                if (range) {
                    quillInstance.current?.insertEmbed(range.index, 'image', imageUrl);
                    quillInstance.current?.setSelection(range.index + 1, 0);
                }
            } catch (err) {
                handleError(err as Error, 'Failed to upload image');
            }
        };
    }, [config]);

    const handleSave = useCallback(async () => {
        if (!quillInstance.current) return;

        setIsSaving(true);
        setError(null);

        try {
            if (!title.trim()) {
                throw new Error('Title is required');
            }

            const content: Omit<BlogContent, 'id'> = {
                title: title.trim(),
                content: quillInstance.current.root.innerHTML,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                published: initialContent?.published || false,
                tags: initialContent?.tags || [],
                excerpt: initialContent?.excerpt || '',
            };

            let savedPost: BlogContent;

            if (initialContent?.id) {
                // Update existing post
                savedPost = await apiClient.updatePost(initialContent.id, content);
            } else {
                // Create new post
                savedPost = await apiClient.addPost(content);
            }

            // Callbacks
            onSave?.(savedPost);
        } catch (err) {
            handleError(err as Error, 'Failed to save post');
        } finally {
            setIsSaving(false);
        }
    }, [title, initialContent, onSave]);

    const handleError = useCallback((error: Error, defaultMessage: string) => {
        const message = error.message || defaultMessage;
        setError(message);
        onError?.({
            message,
            details: error
        });
    }, [onError]);

    if (!isLoading && error) {
        return (
            <div className={`blog-editor-error ${className}`} role="alert">
                {error}
            </div>
        );
    }

    // if (isLoading) {
    //     return <div className={`blog-editor-loading ${className}`}>Loading editor...</div>;
    // }

    return (
        <div className={`blog-editor-container ${className}`}>
            {error && (
                <div className="blog-editor-error" role="alert">
                    {error}
                </div>
            )}

            <input
                type="text"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    if (onContentChange && quillInstance.current) {
                        onContentChange({
                            title: e.target.value,
                            content: quillInstance.current.root.innerHTML,
                        });
                    }
                }}
                placeholder="Blog post title"
                className="blog-editor-title"
                aria-label="Blog post title"
            />

            <div className="blog-editor-wrapper">
                <div ref={quillRef} className="blog-editor" aria-label="Blog post content editor" />
            </div>

            <div className="blog-editor-actions">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="blog-editor-save-button"
                    aria-label="Save blog post"
                >
                    {isSaving ? 'Saving...' : initialContent?.id ? 'Update Post' : 'Save Post'}
                </button>
            </div>
        </div>
    );
};

export default BlogEditor;
