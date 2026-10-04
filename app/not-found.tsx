import ErrorScreen from "@/components/ErrorScreen";

export const metadata = { title: "הדף לא נמצא · גדוד 13, חטיבת גולני" };

export default function NotFound() {
  return (
    <ErrorScreen
      eyebrow="404"
      title="הדף שחיפשתם לא נמצא"
      message="ייתכן שהכתובת שגויה או שהדף הועבר. אפשר לחזור לעמוד הבית או לקיר ההנצחה."
    />
  );
}
