import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  content_html: string;
  cover_image_url: string | null;
  category: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostSummary {
  title: string;
  slug: string;
}

/** Published posts, newest first — powers the /tin-tuc listing. */
export async function getPublishedPosts(): Promise<BlogPostSummary[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('title, slug')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[blogPosts] Failed to load published posts:', error.message);
    return [];
  }
  return data ?? [];
}

/**
 * A single published post by slug, for the public /tin-tuc/[slug] page.
 * RLS restricts anonymous reads to `published = true`, so an unpublished
 * draft or nonexistent slug both resolve to `null` here.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
