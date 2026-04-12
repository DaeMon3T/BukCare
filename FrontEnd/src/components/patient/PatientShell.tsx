import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PatientShellProps {
  badge?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  heroFooter?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
  contentClassName?: string;
}

interface PatientPanelProps {
  children: ReactNode;
  className?: string;
}

interface PatientSectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const joinClasses = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(" ");

export const PatientPanel = ({ children, className }: PatientPanelProps) => (
  <div
    className={joinClasses(
      "relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/78 backdrop-blur-xl shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]",
      className
    )}
  >
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
    {children}
  </div>
);

export const PatientSectionHeader = ({
  eyebrow,
  title,
  description,
  action,
  className,
}: PatientSectionHeaderProps) => (
  <div
    className={joinClasses(
      "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
      className
    )}
  >
    <div className="space-y-1">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700/80">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

const PatientShell = ({
  badge = "Patient Experience",
  title,
  subtitle,
  actions,
  heroFooter,
  children,
  maxWidthClassName = "max-w-7xl",
  contentClassName,
}: PatientShellProps) => {
  return (
    <div className="min-h-screen text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[-12rem] top-[-10rem] h-[26rem] w-[26rem] rounded-full bg-sky-300/20 blur-3xl" />
          <div className="absolute right-[-10rem] top-[10%] h-[24rem] w-[24rem] rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[30%] h-[24rem] w-[24rem] rounded-full bg-amber-200/20 blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px)",
            backgroundSize: "84px 84px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.08))",
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="pb-28 pt-4 lg:pb-12">
          <div className={joinClasses("mx-auto px-4 sm:px-6 lg:px-8", maxWidthClassName)}>
            <PatientPanel className="mb-6 p-5 sm:mb-8 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_34%),linear-gradient(135deg,rgba(14,165,233,0.08),transparent_45%)]" />
              <div className="relative">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      {badge}
                    </div>
                    <div className="space-y-3">
                      <h1 className="font-premium text-[2.15rem] leading-none tracking-[-0.04em] text-slate-950 sm:text-[3rem]">
                        {title}
                      </h1>
                      {subtitle ? (
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {actions ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                      {actions}
                    </div>
                  ) : null}
                </div>

                {heroFooter ? <div className="mt-6">{heroFooter}</div> : null}
              </div>
            </PatientPanel>

            <div className={joinClasses("space-y-6 sm:space-y-8", contentClassName)}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientShell;
