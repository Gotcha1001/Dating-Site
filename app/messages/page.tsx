import { ConversationList } from "@/app/components/ConversationList";

export default function MessagesPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Messages</h1>
      <ConversationList />
    </div>
  );
}
