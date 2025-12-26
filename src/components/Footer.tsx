import pkg from "../../package.json";

export default function Footer() {
  const version = typeof pkg?.version === "string" ? pkg.version : "dev";
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container mx-auto px-4 py-2 text-sm text-muted-foreground text-center">
        © 2026 Faculty of Information Technology – Lac Hong University (version{" "}
        {version})
      </div>
    </footer>
  );
}
