import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, ArrowRight, Star } from "lucide-react";
import { format } from "date-fns";
import type { Blog } from "@shared/schema";

export default function BlogPage() {
  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ["/api/blogs"],
  });

  const featuredBlogs = blogs?.filter(b => b.isFeatured) || [];
  const regularBlogs = blogs?.filter(b => !b.isFeatured) || [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <section className="relative py-20 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
                News & Updates
              </h1>
              <p className="text-lg text-muted-foreground" data-testid="text-blog-subtitle">
                Stay updated with the latest news, tips, and happenings at The Quarterdeck
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : blogs?.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
              <p className="text-muted-foreground">
                We're working on bringing you exciting content. Check back soon!
              </p>
            </div>
          ) : (
            <>
              {featuredBlogs.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Featured Posts
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {featuredBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} featured />
                    ))}
                  </div>
                </div>
              )}

              {regularBlogs.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}

function BlogCard({ blog, featured = false }: { blog: Blog; featured?: boolean }) {
  return (
    <Card 
      className={`overflow-hidden hover-elevate transition-all ${featured ? "md:col-span-1" : ""}`}
      data-testid={`card-blog-${blog.id}`}
    >
      {blog.featuredImageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={blog.featuredImageUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          {blog.category && (
            <Badge className="absolute top-3 left-3" variant="secondary">
              {blog.category}
            </Badge>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <Link href={`/blog/${blog.slug}`}>
          <h3 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2 cursor-pointer">
            {blog.title}
          </h3>
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          {blog.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(blog.publishedAt), "MMM d, yyyy")}
            </span>
          )}
          {blog.readTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {blog.readTimeMinutes} min read
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {blog.excerpt && (
          <p className="text-muted-foreground line-clamp-3">{blog.excerpt}</p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/blog/${blog.slug}`}>
          <Button variant="ghost" className="gap-2 p-0 h-auto" data-testid={`button-read-blog-${blog.id}`}>
            Read More <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
