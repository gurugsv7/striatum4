import { notFound } from "next/navigation";
import StyleguideClient from "./StyleguideClient";

/**
 * The design system reference renders real (fake) sample data — including a
 * literal Delegate ID and a QR encoding it — so it must never be reachable
 * in production. It stays fully live in development, since it's how the
 * design system gets reviewed.
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <StyleguideClient />;
}
