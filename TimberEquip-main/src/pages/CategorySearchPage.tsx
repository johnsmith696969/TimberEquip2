import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { taxonomyService } from '../services/taxonomyService';
import { normalizeSeoSlug, titleCaseSlug } from '../utils/seoRoutes';
import { Search, type CategoryRouteInfo } from './Search';

function LoadingState() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted">Loading Category...</div>
    </div>
  );
}

export function CategorySearchPage() {
  const { categorySlug = '' } = useParams<{ categorySlug: string }>();
  const [categoryRoute, setCategoryRoute] = useState<CategoryRouteInfo | null>(null);

  useEffect(() => {
    let active = true;

    const resolve = async () => {
      try {
        const taxonomy = await taxonomyService.getTaxonomy();

        if (!active) return;

        // Check top-level categories first (e.g. "Logging Equipment")
        const topLevelMatch = Object.keys(taxonomy).find(
          (cat) => normalizeSeoSlug(cat) === categorySlug
        );
        if (topLevelMatch) {
          setCategoryRoute({ categoryName: topLevelMatch, slug: categorySlug, isTopLevel: true });
          return;
        }

        // Then check subcategories (e.g. "Skidders", "Feller Bunchers")
        const allSubcategories = Object.values(taxonomy).flatMap((subMap) => Object.keys(subMap));
        const subMatch = allSubcategories.find(
          (sub) => normalizeSeoSlug(sub) === categorySlug
        );
        if (subMatch) {
          setCategoryRoute({ categoryName: subMatch, slug: categorySlug, isTopLevel: false });
          return;
        }

        // Fallback: treat as top-level with title-cased slug
        setCategoryRoute({ categoryName: titleCaseSlug(categorySlug), slug: categorySlug, isTopLevel: true });
      } catch (error) {
        console.error('Failed to resolve category:', error);
        if (active) {
          setCategoryRoute({ categoryName: titleCaseSlug(categorySlug), slug: categorySlug, isTopLevel: true });
        }
      }
    };

    setCategoryRoute(null);
    resolve();

    return () => {
      active = false;
    };
  }, [categorySlug]);

  if (!categoryRoute) return <LoadingState />;

  return <Search key={categorySlug} categoryRoute={categoryRoute} />;
}
