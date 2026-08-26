/**
 * 🇧🇩 ব্লগ সার্ভিস ও স্টেট প্যাটার্ন (Blog Management & State Pattern)
 * 
 * রিকোয়ারমেন্ট:
 * - Content Manager এবং Admin ব্লগ লিখতে, এডিট করতে, পাবলিশ ও ড্রাফট করতে পারবে।
 * - ড্রাফট (Draft) অবস্থায় ব্লগ শুধুমাত্র Admin ও Content Manager দেখতে পাবে।
 * - সাধারণ শিক্ষার্থী এবং পাবলিক ইউজার শুধুমাত্র Published ব্লগ দেখতে পাবে।
 * - Admin যেকোনো ব্লগ ডিলিট/ম্যানেজ করতে পারবে।
 */

import { BlogPost, User } from '../../src/types';
import { DatabaseRepository } from '../repositories/database';

const db = DatabaseRepository.getInstance();

export class BlogService {
  /**
   * 🇧🇩 রোল অনুযায়ী ব্লগ পোস্টের তালিকা প্রদান
   */
  public static getBlogsForUser(user?: User): BlogPost[] {
    const isPrivileged = user && (user.role === 'admin' || user.role === 'content_manager');
    // প্রিভিলেজড ইউজার ড্রাফট ও পাবলিশড দুটোই দেখবে, অন্যরা শুধু পাবলিশড
    return db.getBlogPosts(!isPrivileged);
  }

  /**
   * 🇧🇩 নতুন ব্লগ তৈরি করা (Draft অথবা Published)
   */
  public static createBlog(
    user: User,
    data: {
      title: string;
      content: string;
      excerpt?: string;
      coverImageUrl?: string;
      tags?: string[];
      status?: 'draft' | 'published';
    }
  ): BlogPost {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const wordCount = data.content.split(/\s+/).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const post: BlogPost = {
      id: `blg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: data.title,
      slug: `${slug}-${Math.random().toString(36).substr(2, 4)}`,
      excerpt: data.excerpt || data.content.substring(0, 160) + '...',
      content: data.content,
      coverImageUrl: data.coverImageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      status: data.status || 'draft',
      tags: data.tags || ['General'],
      readTimeMinutes,
      publishedAt: data.status === 'published' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return db.createBlogPost(post);
  }

  /**
   * 🇧🇩 ব্লগ স্ট্যাটাস টগল (Draft <-> Published)
   */
  public static togglePublishStatus(id: string, user: User): BlogPost {
    const post = db.getBlogPostById(id);
    if (!post) throw new Error('Blog post not found');

    const newStatus = post.status === 'published' ? 'draft' : 'published';
    return db.updateBlogPost(id, {
      status: newStatus,
      publishedAt: newStatus === 'published' ? new Date().toISOString() : post.publishedAt
    });
  }
}
