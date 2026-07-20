"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: { label: string; href: string }[];
}

/**
 * 모바일 전용 풀스크린 네비게이션.
 */
export function MobileNav({ open, onClose, items }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
        >
          <div className="container-px flex h-16 items-center justify-between border-b border-border">
            <span className="text-lg font-bold">DesignFOBEE</span>
            <button aria-label="메뉴 닫기" onClick={onClose}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="container-px flex flex-1 flex-col justify-center gap-8 py-10">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="text-2xl font-semibold"
              >
                {item.label}
              </a>
            ))}

            <a
              href="/design"
              onClick={onClose}
              className={buttonVariants({ size: "lg", className: "mt-4 w-full" })}
            >
              AI 디자인 시작하기
            </a>

            <a
              href="/login"
              onClick={onClose}
              className="text-center text-sm font-medium text-muted-foreground"
            >
              로그인
            </a>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
