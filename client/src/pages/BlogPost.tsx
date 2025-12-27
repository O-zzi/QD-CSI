import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, ArrowLeft, User } from "lucide-react";
import { format } from "date-fns";
import type { Blog } from "@shared/schema";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: blog, isLoading, error } = useQuery<Blog>({
    queryKey: ["/api/blogs", slug],
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/blog">
            <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back-blog">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>

          <header className="mb-8">
            {blog.category && (
              <Badge className="mb-4" variant="secondary">
                {blog.category}
              </Badge>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" data-testid="text-blogpost-title">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {blog.author && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {blog.author}
                </span>
              )}
              {blog.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(blog.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
              {blog.readTimeMinutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {blog.readTimeMinutes} min read
                </span>
              )}
            </div>
          </header>

          {blog.featuredImageUrl && (
            <div className="relative mb-8 rounded-lg overflow-hidden">
              <img
                src={blog.featuredImageUrl}
                alt={blog.title}
                className="w-full h-auto max-h-[500px] object-cover"
                data-testid="img-blogpost-featured"
              />
            </div>
          )}

          {blog.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 font-medium border-l-4 border-primary pl-4">
              {blog.excerpt}
            </p>
          )}

          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            data-testid="content-blogpost"
          >
            {blog.content?.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index}>{paragraph}</p>
              )
            ))}
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
      <Footer />
    </>
  );
}
