import { NavLink } from "react-router";

import { Logo } from "@/components/common/logo";

export function Footer() {
  return (
    <>
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-2 py-8 px-4 border-t border-edge text-sm text-muted">
        <NavLink to="/">
          <Logo variant="full" size="sm" />
        </NavLink>

        <span>All rights reserved 2026 ©</span>
      </footer>
    </>
  );
}
