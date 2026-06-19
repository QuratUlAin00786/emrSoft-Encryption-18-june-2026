import { Button } from "@/components/ui/button";
import { DEMO_CREDENTIALS } from "@/lib/branding";

interface DemoCredentialsPanelProps {
  onSelect: (email: string, password: string) => void;
  /** Hide the section title when the parent already shows one (e.g. login.tsx card) */
  showHeader?: boolean;
}

export function DemoCredentialsPanel({
  onSelect,
  showHeader = true,
}: DemoCredentialsPanelProps) {
  return (
    <div className={showHeader ? "mt-4" : "mt-0"}>
      {showHeader && (
        <div className="relative mb-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-gray-900 px-2 font-semibold text-blue-600 dark:text-blue-400">
              Demo Credentials
            </span>
          </div>
        </div>
      )}

      <ul className="space-y-0 text-[11px] leading-snug sm:text-xs">
        {DEMO_CREDENTIALS.map((cred) => (
          <li
            key={cred.role}
            className="truncate rounded px-1 py-0.5 text-gray-700 dark:text-gray-300"
            title={`${cred.email} / ${cred.password}`}
          >
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {cred.role}:
            </span>{" "}
            {cred.email}
            <span className="text-gray-400"> / </span>
            {cred.password}
          </li>
        ))}
      </ul>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {DEMO_CREDENTIALS.slice(0, 6).map((cred) => (
          <Button
            key={cred.role}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-1 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950 sm:text-xs"
            onClick={() => onSelect(cred.email, cred.password)}
          >
            {cred.role}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1.5 h-7 w-full text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950 sm:text-xs"
        onClick={() =>
          onSelect(DEMO_CREDENTIALS[6].email, DEMO_CREDENTIALS[6].password)
        }
      >
        Admin
      </Button>
    </div>
  );
}
