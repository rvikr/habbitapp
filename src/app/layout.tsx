import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme-provider";
import { CelebrationProvider } from "@/components/celebration";
import { NotificationScheduler } from "@/components/notification-scheduler";
import { getReminderSchedule } from "@/lib/reminders";

export const metadata: Metadata = {
  title: "Morning Routine — Habit Tracker",
  description: "A quiet, encouraging space to build the habits you care about.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f9fa",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schedule = await getReminderSchedule();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="text-on-background bg-background pb-32 selection:bg-primary-fixed">
        <ThemeProvider>
          <CelebrationProvider>
            {children}
            <BottomNav />
            <NotificationScheduler schedule={schedule} />
          </CelebrationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
