import EmptyState from "../EmptyState";

export default function EmptyStateExample() {
  return (
    <div className="h-screen">
      <EmptyState onSuggestionClick={(msg) => console.log("Suggestion clicked:", msg)} />
    </div>
  );
}
