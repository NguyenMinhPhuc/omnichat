"use client";

// Firebase storage was removed. This helper is intentionally a stub.
export const uploadFile = async (
  _file: File,
  _path: string
): Promise<string> => {
  throw new Error(
    "uploadFile is not available: server-side uploads are disabled."
  );
};
