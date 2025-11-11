import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * MobileSheetMenu - A reusable mobile navigation menu component
 * 
 * Displays a hamburger menu button on mobile (hidden on md+ screens) that opens
 * a Sheet (slide-in panel) from the left containing navigation menu items.
 * 
 * @param {Array} menuItems - Array of menu items with structure:
 *   { title: string, icon: Component, path: string, description?: string }
 * @param {string} basePath - Base path for menu items (e.g., "/events/:slug")
 * @param {string} menuTitle - Title displayed in the sheet header
 * @param {function} isSelectedFn - Optional function to determine if item is selected
 *   Signature: (item, location) => boolean
 * @param {function} onItemClick - Optional callback when menu item is clicked
 * 
 * @example
 * // Basic usage in an edit page:
 * <MobileSheetMenu
 *   menuItems={menuItems}
 *   basePath={`/events/${slug}`}
 *   menuTitle="Event Settings"
 * />
 * 
 * @example
 * // With custom selection logic:
 * <MobileSheetMenu
 *   menuItems={menuItems}
 *   basePath={`/events/${slug}`}
 *   menuTitle="Event Settings"
 *   isSelectedFn={(item, location) => {
 *     if (item.path === "") {
 *       return location.pathname === `/events/${slug}`;
 *     }
 *     return location.pathname.endsWith(`/${item.path}`);
 *   }}
 * />
 */
export default function MobileSheetMenu({
  menuItems,
  basePath,
  menuTitle,
  isSelectedFn,
  onItemClick,
}) {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  const handleItemClick = (item) => {
    setOpen(false);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const isSelected = (item) => {
    if (isSelectedFn) {
      return isSelectedFn(item, location);
    }

    // Default selection logic
    if (item.path === "") {
      return location.pathname === basePath ||
        location.pathname === `${basePath}/edit`;
    }
    return location.pathname.endsWith(`/${item.path}`);
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle>{menuTitle}</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const selected = isSelected(item);

              return (
                <Button
                  key={item.path}
                  variant={selected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    "hover:bg-muted dark:hover:bg-secondary",
                    selected && "bg-muted dark:bg-secondary"
                  )}
                  asChild
                  onClick={() => handleItemClick(item)}
                >
                  <Link to={item.path}>
                    <Icon
                      className={cn("h-4 w-4", selected && "text-primary")}
                    />
                    <span className={cn(selected && "font-medium")}>
                      {item.title}
                    </span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
