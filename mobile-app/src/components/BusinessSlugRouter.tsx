import { useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

/**
 * BusinessSlugRouter
 * - Reads :slug from the URL and stores it in localStorage as `businessSlug`.
 * - Renders the existing DashboardLayout so the slugged URL shows the same UI.
 *
 * This is intentionally small and non-invasive: most internal navigation still
 * uses absolute routes (e.g. /business/settings). This wrapper gives a stable
 * unique entry URL for each business (e.g. /b/acme-inc) which can be expanded
 * later to rewrite internal links to use the slug.
 */
export default function BusinessSlugRouter() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (slug) {
      try {
        localStorage.setItem('businessSlug', slug);
        // also keep a timestamp to help debugging/visibility
        localStorage.setItem('businessSlugSetAt', new Date().toISOString());
      } catch (e) {
        // ignore storage errors
        // eslint-disable-next-line no-console
        console.warn('Could not persist business slug', e);
      }
    }
  }, [slug]);

  return <DashboardLayout />;
}
