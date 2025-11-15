import ChatInput from "../ChatInput";

export default function ChatInputExample() {
  return (
    <div className="h-screen flex flex-col justify-end">
      <ChatInput
        onSend={(msg) => console.log("Message sent:", msg)}
        disabled={false}
      />
    </div>
  );
}
