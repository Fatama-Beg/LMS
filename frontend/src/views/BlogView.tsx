/**
 * 🇧🇩 ব্লগ সিএমএস ভিউ (Blog Portal & Draft/Publish State CMS)
 * 
 * রিকোয়ারমেন্ট:
 * - Content Manager and Admin can write, edit, publish, and delete blog posts.
 * - Draft vs Published state: only published posts are visible to students/public; drafts are hidden.
 * - Anyone can read published posts.
 * - Admin has full control over every blog post.
 */

import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

export const BlogView: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);

  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    tags: 'Architecture, Next.js',
    status: 'draft' as 'draft' | 'published'
  });

  const isPrivileged = activeRole === 'admin' || activeRole === 'content_manager';

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.getBlogs();
      if (res.success) {
        setBlogs(res.blogs);
      }
    } catch (err) {
      console.error('Failed to load blogs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentUser, activeRole]);

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBlog?.id) {
        await api.updateBlog(editingBlog.id, {
          ...blogForm,
          tags: blogForm.tags.split(',').map(t => t.trim())
        });
      } else {
        await api.createBlog({
          ...blogForm,
          tags: blogForm.tags.split(',').map(t => t.trim())
        });
      }
      setIsEditorOpen(false);
      setEditingBlog(null);
      fetchBlogs();
    } catch (err: any) {
      alert(err.message || 'Blog action failed');
    }
  };

  const handleToggleStatus = async (blogId: string) => {
    try {
      await api.toggleBlogStatus(blogId);
      fetchBlogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await api.deleteBlog(blogId);
        if (selectedPost?.id === blogId) setSelectedPost(null);
        fetchBlogs();
      } catch (err: any) {
        alert(err.message || 'Failed to delete blog');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-indigo-600" />
            <span>Engineering Insights & Blog CMS</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Technical publications, architectural walkthroughs, and LMS updates.
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => {
              setEditingBlog(null);
              setBlogForm({
                title: '',
                content: '',
                excerpt: '',
                coverImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
                tags: 'Architecture, Next.js',
                status: 'draft'
              });
              setIsEditorOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Blog Post</span>
          </button>
        )}
      </div>

      {/* Role State Indicator */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
        <span className="text-slate-600">
          Viewing mode as: <strong className="uppercase text-indigo-700">{activeRole}</strong>
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          {isPrivileged
            ? '🔓 Full Editorial Clearance (Viewing Drafts & Published)'
            : '🔒 Public / Student View (Showing Published Posts Only)'}
        </span>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-slate-800">No blog posts available</h3>
          <p className="text-xs text-slate-500">Check back later for new engineering insights.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((post) => {
            const isDraft = post.status === 'draft';
            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={post.coverImageUrl || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs ${
                        isDraft
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>By {post.authorName} ({post.authorRole})</span>
                      <span>{post.readTimeMinutes} min read</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read Full Post</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {isPrivileged && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(post.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isDraft
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {isDraft ? 'Publish' : 'Unpublish'}
                          </button>

                          <button
                            onClick={() => {
                              setEditingBlog(post);
                              setBlogForm({
                                title: post.title,
                                content: post.content,
                                excerpt: post.excerpt,
                                coverImageUrl: post.coverImageUrl || '',
                                tags: post.tags?.join(', ') || '',
                                status: post.status
                              });
                              setIsEditorOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteBlog(post.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedPost.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedPost.status}
              </span>
              <button onClick={() => setSelectedPost(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {selectedPost.coverImageUrl && (
              <img
                src={selectedPost.coverImageUrl}
                alt={selectedPost.title}
                className="w-full h-64 rounded-xl object-cover"
              />
            )}

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{selectedPost.title}</h1>
              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span>By {selectedPost.authorName} ({selectedPost.authorRole})</span>
                <span>•</span>
                <span>{selectedPost.readTimeMinutes} min read</span>
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 p-6 rounded-xl border border-slate-100">
              {selectedPost.content}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="e.g. Modern Fullstack Architecture"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Excerpt</label>
                <input
                  type="text"
                  value={blogForm.excerpt}
                  onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={blogForm.coverImageUrl}
                  onChange={e => setBlogForm({ ...blogForm, coverImageUrl: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Content (Markdown / Text)</label>
                <textarea
                  rows={6}
                  required
                  value={blogForm.content}
                  onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  placeholder="Write full article here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
                  <select
                    value={blogForm.status}
                    onChange={e => setBlogForm({ ...blogForm, status: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="draft">Draft (Hidden from students)</option>
                    <option value="published">Published (Visible to all)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tags</label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={e => setBlogForm({ ...blogForm, tags: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
