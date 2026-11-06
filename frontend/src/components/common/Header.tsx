import { useState } from "react";
import { NavLink } from "react-router";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      {/* NAVBAR */}
      <header className="sticky top-0 relative z-50 border-b border-edge bg-app">
        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4">
          {/* Logo */}
          <NavLink to="/" onClick={closeMenu}>
            <Logo variant="full" size="md" />
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-5 lg:gap-8">
            <NavLink to="/register">
              <div className="rounded-full py-2 px-5 bg-white text-blue-700 border border-blue-700 hover:bg-blue-100 hover:border-blue-500 active:scale-[0.98] transition">
                Sign Up
              </div>
            </NavLink>

            <NavLink to="/login">
              <div className="rounded-full py-2 px-5 bg-blue-700 text-white border border-blue-700 hover:bg-blue-500 hover:border-blue-500 active:scale-[0.98] transition">
                Sign In
              </div>
            </NavLink>

            <ThemeToggle />
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="p-2 rounded-lg border border-edge text-fg hover:bg-gray-100 transition"
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="absolute top-full left-0 w-full md:hidden bg-app border-b border-edge shadow-lg"
          >
            <div className="flex flex-col gap-3 p-5">
              <NavLink
                to="/register"
                onClick={closeMenu}
                className="w-full text-center rounded-full py-3 px-5 text-blue-700 border border-blue-700 hover:bg-blue-100 transition"
              >
                Sign Up
              </NavLink>

              <NavLink
                to="/login"
                onClick={closeMenu}
                className="w-full text-center rounded-full py-3 px-5 bg-blue-700 text-white hover:bg-blue-500 transition"
              >
                Sign In
              </NavLink>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
