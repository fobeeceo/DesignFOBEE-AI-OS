import { createClient } from "@/lib/supabase/server";
import { GbStoreUserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ROLE_HIERARCHY, HQ_ROLES } from "./constants";
import { prisma } from "@/lib/prisma";

export interface GbSession {
  userId: string;
  email: string | undefined;
  storeUser: {
    storeId: string;
    role: GbStoreUserRole;
    displayName: string;
  } | null;
  isCustomer: boolean;
}

export async function getGbSession(): Promise<GbSession | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const storeUser = await prisma.gbStoreUser.findFirst({
      where: { id: user.id, isActive: true },
      select: { storeId: true, role: true, displayName: true },
    });

    const customer = !storeUser
      ? await prisma.gbCustomer.findUnique({
          where: { id: user.id, isActive: true },
          select: { id: true },
        })
      : null;

    return {
      userId: user.id,
      email: user.email,
      storeUser: storeUser ?? null,
      isCustomer: !!customer,
    };
  } catch {
    return null;
  }
}

export function hasRole(session: GbSession, minRole: GbStoreUserRole): boolean {
  if (!session.storeUser) return false;
  return ROLE_HIERARCHY[session.storeUser.role] >= ROLE_HIERARCHY[minRole];
}

export function isHqRole(role: GbStoreUserRole): boolean {
  return HQ_ROLES.includes(role);
}

export function isStoreRole(role: GbStoreUserRole): boolean {
  return !isHqRole(role);
}

export function withGbAuth(
  handler: (req: NextRequest, session: GbSession) => Promise<NextResponse>,
  options: { minRole?: GbStoreUserRole; customerAllowed?: boolean } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getGbSession();
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (options.minRole && !hasRole(session, options.minRole)) {
      if (!options.customerAllowed || !session.isCustomer) {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
      }
    }
    return handler(req, session);
  };
}
