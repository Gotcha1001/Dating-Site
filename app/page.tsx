"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Video, Gift, MapPin, MessagesSquare } from "lucide-react";

const FEATURES = [
  {
    title: "Face-to-face, first",
    description:
      "Video-call before you commit to a coffee date. See who you're really talking to, right from the app.",
    icon: Video,
  },
  {
    title: "Nearby, on your terms",
    description:
      "Search by distance and who you're seeking. Widen the radius or narrow it — you're in control.",
    icon: MapPin,
  },
  {
    title: "Say it with a gift",
    description:
      "Send a rose, a coffee, or something bigger when words aren't quite enough.",
    icon: Gift,
  },
  {
    title: "Conversations that go somewhere",
    description:
      "Real-time messaging built for actually getting to know someone, not just matching and vanishing.",
    icon: MessagesSquare,
  },
];

export default function Home(): React.JSX.Element {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.prefetch("/discover");
  }, [isSignedIn, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-white px-6 text-center dark:bg-[#1c1024]">
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-rose-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full bg-fuchsia-900/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-16 pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-serif text-6xl font-medium tracking-tight text-[#2A1B3D] dark:text-white md:text-7xl"
          style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif" }}
        >
          Meet someone real.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-5 max-w-md text-lg text-gray-600 dark:text-gray-300"
        >
          Spark connects you with people nearby through video, messages, and
          small gestures — before the first date ever happens.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          {isSignedIn ? (
            <Button
              size="lg"
              className="bg-rose-600 px-10 py-6 text-lg text-white shadow-lg hover:bg-rose-500"
              onClick={() => router.push("/discover")}
            >
              Go to Discover
            </Button>
          ) : (
            <>
              <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                <Button
                  size="lg"
                  className="bg-rose-600 px-10 py-6 text-lg text-white shadow-lg hover:bg-rose-500"
                >
                  Join Spark
                </Button>
              </SignInButton>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-rose-400 px-10 py-6 text-lg text-rose-600 dark:text-rose-300"
                >
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </div>

      <div className="relative z-10 grid w-full max-w-5xl gap-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-rose-100 bg-white/70 p-6 text-left shadow-sm backdrop-blur-sm dark:border-rose-900/20 dark:bg-white/5"
          >
            <feature.icon className="mb-3 text-rose-500" size={22} />
            <h3 className="mb-1 font-semibold text-[#2A1B3D] dark:text-white">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
