import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as usersService from "../services/usersService";

export async function login(req: NextRequest) {
  const { email: rawEmail, password: rawPassword } = (await req.json()) as {
    email?: string;
    password?: string;
  };

  const email = rawEmail?.trim() || "";
  const password = rawPassword ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await usersService.getByEmail(email);
  if (!user) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { message: "Password not set for this account" },
      { status: 400 }
    );
  }

  const isBcrypt = user.passwordHash.startsWith("$2");
  const ok = isBcrypt
    ? await bcrypt.compare(password, user.passwordHash)
    : user.passwordHash === password;
  if (!ok) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  if (user.status && user.status !== "active") {
    return NextResponse.json(
      { message: `Account status is ${user.status}` },
      { status: 403 }
    );
  }

  // Return safe user payload (no password)
  const { passwordHash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
